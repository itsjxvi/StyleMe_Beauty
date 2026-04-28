import { Router } from "express";
import { db, usersTable, activityLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Solicitud inválida" });
    return;
  }
  const { email, password } = parsed.data;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = users[0];
  if (!user || user.password_hash !== password) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ error: "Cuenta desactivada" });
    return;
  }
  await db.insert(activityLogsTable).values({
    user_id: user.id, user_name: user.full_name, user_role: user.role,
    action: "login", entity_type: "auth", entity_id: user.id,
    description: `${user.full_name} inició sesión`,
    ip_address: (req.ip || (req.headers["x-forwarded-for"] as string) || null) as any,
  });
  const { password_hash: _, ...safeUser } = user;
  res.json({ user: safeUser, token: `token-${user.id}` });
});

const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional().nullable(),
});

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues }); return; }
  const { full_name, email, password, phone } = parsed.data;
  const exists = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (exists[0]) { res.status(409).json({ error: "El correo ya está registrado" }); return; }
  const inserted = await db.insert(usersTable).values({
    full_name, email, password_hash: password, role: "client", phone: phone ?? null, is_active: true,
  }).returning();
  const u = inserted[0];
  await db.insert(activityLogsTable).values({
    user_id: u.id, user_name: u.full_name, user_role: u.role,
    action: "register", entity_type: "auth", entity_id: u.id,
    description: `${u.full_name} se registró como cliente`,
  });
  const { password_hash: _, ...safeUser } = u;
  res.status(201).json({ user: safeUser, token: `token-${u.id}` });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) { res.status(401).json({ error: "Unauthorized" }); return; }
  const tokenParts = auth.replace("Bearer ", "").split("-");
  const userId = parseInt(tokenParts[1]);
  if (isNaN(userId)) { res.status(401).json({ error: "Unauthorized" }); return; }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const { password_hash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
