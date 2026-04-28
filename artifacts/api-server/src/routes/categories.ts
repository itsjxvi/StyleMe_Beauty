import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/categories", async (_req, res) => {
  const items = await db.select().from(categoriesTable).orderBy(categoriesTable.id);
  res.json({ items });
});

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

router.post("/categories", async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const inserted = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json(inserted[0]);
});

router.put("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const updated = await db.update(categoriesTable).set(parsed.data).where(eq(categoriesTable.id, id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated[0]);
});

router.delete("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.status(204).send();
});

export default router;
