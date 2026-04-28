import { Router } from "express";
import { db, promotionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { type AuthedRequest, requireAuth, requirePermission, logActivity } from "../lib/auth";

const router = Router();

router.get("/promotions", async (_req, res) => {
  const items = await db.select().from(promotionsTable).orderBy(promotionsTable.id);
  res.json({
    items: items.map(p => ({
      ...p,
      value: Number(p.value),
      min_amount: Number(p.min_amount),
    })),
  });
});

router.get("/promotions/active", async (_req, res) => {
  const all = await db.select().from(promotionsTable);
  const now = new Date();
  const items = all.filter(p => {
    if (!p.is_active) return false;
    if (p.starts_at && new Date(p.starts_at) > now) return false;
    if (p.ends_at && new Date(p.ends_at) < now) return false;
    return true;
  }).map(p => ({ ...p, value: Number(p.value), min_amount: Number(p.min_amount) }));
  res.json({ items });
});

const promoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  type: z.enum(["percent", "amount"]),
  value: z.coerce.number().positive(),
  applies_to: z.enum(["all", "products", "services"]).default("all"),
  min_amount: z.coerce.number().min(0).default(0),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

router.post("/promotions", requireAuth, requirePermission("promotions.create"), async (req: AuthedRequest, res) => {
  const parsed = promoSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Inválido", details: parsed.error.issues }); return; }
  const d = parsed.data;
  const inserted = await db.insert(promotionsTable).values({
    name: d.name,
    description: d.description ?? null,
    code: d.code ? d.code.toUpperCase() : null,
    type: d.type,
    value: String(d.value),
    applies_to: d.applies_to,
    min_amount: String(d.min_amount),
    starts_at: d.starts_at ? new Date(d.starts_at) : null,
    ends_at: d.ends_at ? new Date(d.ends_at) : null,
    is_active: d.is_active,
  }).returning();
  await logActivity(req, "create", "promotion", inserted[0].id, `Promoción creada: ${d.name}`);
  res.status(201).json({ ...inserted[0], value: Number(inserted[0].value), min_amount: Number(inserted[0].min_amount) });
});

router.put("/promotions/:id", requireAuth, requirePermission("promotions.update"), async (req: AuthedRequest, res) => {
  const id = parseInt(req.params.id);
  const parsed = promoSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Inválido" }); return; }
  const d = parsed.data;
  const updated = await db.update(promotionsTable).set({
    name: d.name,
    description: d.description ?? null,
    code: d.code ? d.code.toUpperCase() : null,
    type: d.type,
    value: String(d.value),
    applies_to: d.applies_to,
    min_amount: String(d.min_amount),
    starts_at: d.starts_at ? new Date(d.starts_at) : null,
    ends_at: d.ends_at ? new Date(d.ends_at) : null,
    is_active: d.is_active,
  }).where(eq(promotionsTable.id, id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  await logActivity(req, "update", "promotion", id, `Promoción actualizada: ${d.name}`);
  res.json({ ...updated[0], value: Number(updated[0].value), min_amount: Number(updated[0].min_amount) });
});

router.delete("/promotions/:id", requireAuth, requirePermission("promotions.delete"), async (req: AuthedRequest, res) => {
  const id = parseInt(req.params.id);
  await db.delete(promotionsTable).where(eq(promotionsTable.id, id));
  await logActivity(req, "delete", "promotion", id, `Promoción #${id} eliminada`);
  res.status(204).send();
});

router.post("/promotions/validate", async (req, res) => {
  const code = (req.body?.code || "").toString().toUpperCase().trim();
  const subtotal = Number(req.body?.subtotal || 0);
  const applies = (req.body?.applies || "all") as "all" | "products" | "services";
  if (!code) { res.status(400).json({ valid: false, error: "Código requerido" }); return; }
  const promo = (await db.select().from(promotionsTable).where(eq(promotionsTable.code, code)))[0];
  if (!promo || !promo.is_active) { res.json({ valid: false, error: "Código inválido" }); return; }
  if (promo.applies_to !== "all" && promo.applies_to !== applies) {
    res.json({ valid: false, error: "Esta promoción no aplica" });
    return;
  }
  if (subtotal < Number(promo.min_amount)) {
    res.json({ valid: false, error: `Compra mínima $${Number(promo.min_amount).toFixed(2)}` });
    return;
  }
  const discount = promo.type === "percent" ? subtotal * Number(promo.value) / 100 : Number(promo.value);
  res.json({
    valid: true,
    promotion: { ...promo, value: Number(promo.value), min_amount: Number(promo.min_amount) },
    discount: Math.min(discount, subtotal),
  });
});

export default router;
