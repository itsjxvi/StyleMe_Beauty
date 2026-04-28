import { Router } from "express";
import { db, brandsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/brands", async (_req, res) => {
  const items = await db.select().from(brandsTable).orderBy(brandsTable.id);
  res.json({ items });
});

const brandSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

router.post("/brands", async (req, res) => {
  const parsed = brandSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const inserted = await db.insert(brandsTable).values(parsed.data).returning();
  res.status(201).json(inserted[0]);
});

router.put("/brands/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = brandSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const updated = await db.update(brandsTable).set(parsed.data).where(eq(brandsTable.id, id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated[0]);
});

router.delete("/brands/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(brandsTable).where(eq(brandsTable.id, id));
  res.status(204).send();
});

export default router;
