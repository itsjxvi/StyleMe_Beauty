import { Router } from "express";
import { db, ordersTable, orderItemsTable, productsTable, stockMovementsTable, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { type AuthedRequest, requireAuth, requirePermission, logActivity } from "../lib/auth";

const router = Router();

router.get("/orders", requireAuth, requirePermission("orders.read"), async (_req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(sql`${ordersTable.id} desc`);
  const items = await db.select().from(orderItemsTable);
  const byOrder: Record<number, any[]> = {};
  for (const it of items) {
    (byOrder[it.order_id] ||= []).push({
      ...it,
      unit_price: Number(it.unit_price),
      subtotal: Number(it.subtotal),
    });
  }
  res.json({
    items: orders.map(o => ({
      ...o,
      delivery_cost: Number(o.delivery_cost),
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      total: Number(o.total),
      items: byOrder[o.id] ?? [],
    })),
  });
});

router.get("/orders/:id", requireAuth, requirePermission("orders.read"), async (req, res) => {
  const id = parseInt(req.params.id);
  const o = (await db.select().from(ordersTable).where(eq(ordersTable.id, id)))[0];
  if (!o) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.order_id, id));
  res.json({
    ...o,
    delivery_cost: Number(o.delivery_cost),
    subtotal: Number(o.subtotal),
    discount: Number(o.discount),
    total: Number(o.total),
    items: items.map(it => ({ ...it, unit_price: Number(it.unit_price), subtotal: Number(it.subtotal) })),
  });
});

const createOrderSchema = z.object({
  customer_name: z.string().min(1),
  customer_phone: z.string().optional().nullable(),
  customer_email: z.string().optional().nullable(),
  is_delivery: z.boolean().default(false),
  delivery_address: z.string().optional().nullable(),
  payment_method: z.enum(["cash", "card", "transfer", "delivery_cash"]).default("cash"),
  promotion_code: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    product_id: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
});

router.post("/orders", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Pedido inválido", details: parsed.error.issues }); return; }
  const d = parsed.data;
  if (d.is_delivery && !d.delivery_address) {
    res.status(400).json({ error: "La dirección de entrega es requerida para envíos a domicilio" });
    return;
  }

  const productIds = d.items.map(i => i.product_id);
  const products = await db.select().from(productsTable);
  const prodMap = new Map(products.map(p => [p.id, p]));

  const lineItems = [];
  let subtotal = 0;
  for (const item of d.items) {
    const prod = prodMap.get(item.product_id);
    if (!prod) { res.status(400).json({ error: `Producto ${item.product_id} no existe` }); return; }
    if (prod.stock < item.quantity) {
      res.status(400).json({ error: `Stock insuficiente de ${prod.name} (disponible: ${prod.stock})` });
      return;
    }
    const unitPrice = Number(prod.price);
    const lineSubtotal = unitPrice * item.quantity;
    subtotal += lineSubtotal;
    lineItems.push({ product_id: prod.id, product_name: prod.name, quantity: item.quantity, unit_price: unitPrice, subtotal: lineSubtotal });
  }

  let discount = 0;
  if (d.promotion_code) {
    const { promotionsTable } = await import("@workspace/db");
    const promo = (await db.select().from(promotionsTable).where(eq(promotionsTable.code, d.promotion_code.toUpperCase())))[0];
    if (promo && promo.is_active && (promo.applies_to === "all" || promo.applies_to === "products")) {
      if (subtotal >= Number(promo.min_amount)) {
        discount = promo.type === "percent" ? subtotal * (Number(promo.value) / 100) : Number(promo.value);
        discount = Math.min(discount, subtotal);
      }
    }
  }

  const deliveryCost = d.is_delivery ? 3.5 : 0;
  const total = subtotal - discount + deliveryCost;

  const inserted = await db.insert(ordersTable).values({
    user_id: req.user?.id ?? null,
    customer_name: d.customer_name,
    customer_phone: d.customer_phone ?? null,
    customer_email: d.customer_email ?? null,
    is_delivery: d.is_delivery,
    delivery_address: d.delivery_address ?? null,
    delivery_cost: String(deliveryCost),
    subtotal: String(subtotal),
    discount: String(discount),
    promotion_code: d.promotion_code ? d.promotion_code.toUpperCase() : null,
    total: String(total),
    payment_method: d.payment_method,
    status: d.payment_method === "delivery_cash" ? "pending" : "paid",
    notes: d.notes ?? null,
  }).returning();
  const order = inserted[0];

  for (const li of lineItems) {
    await db.insert(orderItemsTable).values({
      order_id: order.id,
      product_id: li.product_id,
      product_name: li.product_name,
      quantity: li.quantity,
      unit_price: String(li.unit_price),
      subtotal: String(li.subtotal),
    });
    await db.update(productsTable).set({ stock: sql`${productsTable.stock} - ${li.quantity}` }).where(eq(productsTable.id, li.product_id));
    await db.insert(stockMovementsTable).values({
      product_id: li.product_id, movement_type: "out", quantity: li.quantity, reason: `Venta #${order.id}`,
    });
  }

  await db.insert(notificationsTable).values({
    type: "info",
    title: "Nueva venta",
    message: `Pedido #${order.id} de ${d.customer_name} por $${total.toFixed(2)}`,
    related_id: order.id,
  });
  await logActivity(req, "create", "order", order.id, `Pedido creado por ${d.customer_name} - Total $${total.toFixed(2)}`);

  res.status(201).json({
    ...order,
    delivery_cost: Number(order.delivery_cost),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    total: Number(order.total),
  });
});

const updateOrderSchema = z.object({
  status: z.enum(["pending", "paid", "preparing", "shipped", "delivered", "cancelled"]).optional(),
  notes: z.string().optional().nullable(),
  payment_method: z.enum(["cash", "card", "transfer", "delivery_cash"]).optional(),
});

router.patch("/orders/:id", requireAuth, requirePermission("orders.update"), async (req: AuthedRequest, res) => {
  const id = parseInt(req.params.id);
  const parsed = updateOrderSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Inválido" }); return; }
  const updated = await db.update(ordersTable).set(parsed.data as any).where(eq(ordersTable.id, id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  await logActivity(req, "update", "order", id, `Pedido #${id} actualizado: ${JSON.stringify(parsed.data)}`);
  const o = updated[0];
  res.json({ ...o, delivery_cost: Number(o.delivery_cost), subtotal: Number(o.subtotal), discount: Number(o.discount), total: Number(o.total) });
});

router.delete("/orders/:id", requireAuth, requirePermission("orders.update"), async (req: AuthedRequest, res) => {
  const id = parseInt(req.params.id);
  await db.delete(orderItemsTable).where(eq(orderItemsTable.order_id, id));
  await db.delete(ordersTable).where(eq(ordersTable.id, id));
  await logActivity(req, "delete", "order", id, `Pedido #${id} eliminado`);
  res.status(204).send();
});

export default router;
