import { Router } from "express";
import { db, usersTable, membershipsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router = Router();

router.put("/profile", requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    full_name: z.string().min(2).optional(),
    phone: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  const updated = await db.update(usersTable)
    .set({ ...parsed.data })
    .where(eq(usersTable.id, req.user!.id))
    .returning();
  const { password_hash: _, ...safe } = updated[0];
  res.json(safe);
});

router.post("/profile/change-password", requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  const user = users[0];
  if (!user || user.password_hash !== parsed.data.current_password) {
    res.status(400).json({ error: "Contraseña actual incorrecta" });
    return;
  }
  await db.update(usersTable).set({ password_hash: parsed.data.new_password }).where(eq(usersTable.id, req.user!.id));
  res.json({ success: true });
});

router.get("/memberships/my", requireAuth, async (req: AuthedRequest, res) => {
  const rows = await db.select().from(membershipsTable).where(eq(membershipsTable.user_id, req.user!.id)).limit(1);
  if (!rows[0]) {
    res.json({ tier: "basic", started_at: null, expires_at: null });
    return;
  }
  res.json(rows[0]);
});

router.put("/memberships/upgrade", requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ tier: z.enum(["basic", "premium", "vip"]) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Tier inválido" }); return; }

  const existing = await db.select().from(membershipsTable).where(eq(membershipsTable.user_id, req.user!.id)).limit(1);
  const expiresAt = parsed.data.tier === "basic" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let row;
  if (existing[0]) {
    const updated = await db.update(membershipsTable)
      .set({ tier: parsed.data.tier, started_at: new Date(), expires_at: expiresAt })
      .where(eq(membershipsTable.user_id, req.user!.id))
      .returning();
    row = updated[0];
  } else {
    const inserted = await db.insert(membershipsTable)
      .values({ user_id: req.user!.id, tier: parsed.data.tier, expires_at: expiresAt })
      .returning();
    row = inserted[0];
  }
  res.json(row);
});

export default router;
