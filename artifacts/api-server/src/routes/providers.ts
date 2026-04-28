import { Router } from "express";
import { db, providersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/providers", async (_req, res) => {
  const items = await db.select().from(providersTable).orderBy(providersTable.id);
  res.json({ items });
});

const providerSchema = z.object({
  name: z.string().min(1),
  contact_name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

router.post("/providers", async (req, res) => {
  const parsed = providerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const inserted = await db.insert(providersTable).values(parsed.data).returning();
  res.status(201).json(inserted[0]);
});

router.put("/providers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const parsed = providerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const updated = await db.update(providersTable).set(parsed.data).where(eq(providersTable.id, id)).returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated[0]);
});

router.delete("/providers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(providersTable).where(eq(providersTable.id, id));
  res.status(204).send();
});

export default router;
