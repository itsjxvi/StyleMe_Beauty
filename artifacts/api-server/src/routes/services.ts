import { Router } from "express";
import { db, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/services", async (_req, res) => {
  const items = await db.select().from(servicesTable).orderBy(servicesTable.id);
  res.json({ items: items.map(s => ({ ...s, price: Number(s.price), duration_minutes: s.duration_minutes })) });
});

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive(),
  duration_minutes: z.coerce.number().int().positive(),
  is_active: z.boolean().optional(),
}).passthrough();

function pickService(d: any) {
  return {
    name: d.name,
    description: d.description ?? null,
    price: String(d.price),
    duration_minutes: d.duration_minutes,
    ...(d.is_active !== undefined ? { is_active: d.is_active } : {}),
  };
}

router.post("/services", async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error.issues }); return; }
  const inserted = await db.insert(servicesTable).values(pickService(parsed.data)).returning();
  const s = inserted[0];
  res.status(201).json({ ...s, price: Number(s.price) });
});

router.put("/services/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error.issues }); return; }
  const updated = await db.update(servicesTable).set(pickService(parsed.data)).where(eq(servicesTable.id, id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  const s = updated[0];
  res.json({ ...s, price: Number(s.price) });
});

router.delete("/services/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.status(204).send();
});

export default router;
