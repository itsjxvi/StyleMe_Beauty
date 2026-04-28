import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function serialize(n: any) {
  return { ...n, created_at: n.created_at instanceof Date ? n.created_at.toISOString() : n.created_at };
}

router.get("/notifications", async (req, res) => {
  try {
    const { unread_only } = req.query as any;
    let rows = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.created_at));
    if (unread_only === "true") rows = rows.filter(r => !r.is_read);
    const unread_count = rows.filter(r => !r.is_read).length;
    res.json({ items: rows.map(serialize), unread_count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const createSchema = z.object({
  user_id: z.number().int().nullable().optional(),
  type: z.enum(["reminder", "confirmation", "cancellation", "low_stock", "review", "info"]),
  title: z.string().min(1),
  message: z.string().min(1),
  related_id: z.number().int().nullable().optional(),
});

router.post("/notifications", async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const inserted = await db.insert(notificationsTable).values({
      user_id: parsed.data.user_id ?? null,
      type: parsed.data.type,
      title: parsed.data.title,
      message: parsed.data.message,
      related_id: parsed.data.related_id ?? null,
    }).returning();
    res.status(201).json(serialize(inserted[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/notifications/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await db.update(notificationsTable).set({ is_read: true }).where(eq(notificationsTable.id, id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serialize(updated[0]));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/notifications/read-all", async (_req, res) => {
  try {
    const updated = await db.update(notificationsTable).set({ is_read: true }).where(eq(notificationsTable.is_read, false)).returning();
    res.json({ updated: updated.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/notifications/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
