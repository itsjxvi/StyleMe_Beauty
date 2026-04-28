import { Router } from "express";
import { db, stockMovementsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/stock", async (_req, res) => {
  const rows = await db.select().from(stockMovementsTable).orderBy(stockMovementsTable.id);
  const products = await db.select().from(productsTable);
  const prdMap = Object.fromEntries(products.map(p => [p.id, p.name]));
  const items = rows.map(s => ({
    ...s,
    product_name: prdMap[s.product_id] ?? null,
    created_at: s.created_at.toISOString(),
  }));
  res.json({ items });
});

const stockMovementSchema = z.object({
  product_id: z.number().int(),
  movement_type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int(),
  reason: z.string().optional().nullable(),
});

router.post("/stock", async (req, res) => {
  const parsed = stockMovementSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const inserted = await db.insert(stockMovementsTable).values(parsed.data).returning();
  const s = inserted[0];
  // Update product stock
  const products = await db.select().from(productsTable).where(eq(productsTable.id, parsed.data.product_id)).limit(1);
  if (products[0]) {
    const currentStock = products[0].stock;
    let newStock = currentStock;
    if (parsed.data.movement_type === "in") newStock += parsed.data.quantity;
    else if (parsed.data.movement_type === "out") newStock = Math.max(0, newStock - parsed.data.quantity);
    else newStock = parsed.data.quantity;
    await db.update(productsTable).set({ stock: newStock }).where(eq(productsTable.id, parsed.data.product_id));
  }
  res.status(201).json({ ...s, product_name: null, created_at: s.created_at.toISOString() });
});

export default router;
