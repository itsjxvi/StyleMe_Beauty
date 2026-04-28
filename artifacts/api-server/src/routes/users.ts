import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

router.get("/users", async (req, res) => {
  try {
    let rows = await db.select({
      id: usersTable.id,
      full_name: usersTable.full_name,
      email: usersTable.email,
      role: usersTable.role,
      phone: usersTable.phone,
      is_active: usersTable.is_active,
      created_at: usersTable.created_at,
    }).from(usersTable).orderBy(usersTable.id);
    const { search } = req.query as any;
    if (search) rows = rows.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()));
    res.json({ items: rows.map(r => ({ ...r, created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at })), total: rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const users = await db.select({
    id: usersTable.id,
    full_name: usersTable.full_name,
    email: usersTable.email,
    role: usersTable.role,
    phone: usersTable.phone,
    is_active: usersTable.is_active,
    created_at: usersTable.created_at,
  }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!users[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(users[0]);
});

const createUserSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["admin", "employee", "client"]),
  phone: z.string().optional().nullable(),
});

router.post("/users", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
  const { password, ...data } = parsed.data;
  const inserted = await db.insert(usersTable).values({
    ...data,
    password_hash: password,
  }).returning({
    id: usersTable.id, full_name: usersTable.full_name, email: usersTable.email,
    role: usersTable.role, phone: usersTable.phone, is_active: usersTable.is_active,
    created_at: usersTable.created_at,
  });
  res.status(201).json(inserted[0]);
});

const updateUserSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "employee", "client"]).optional(),
  phone: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  password: z.string().optional(),
});

router.put("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const { password, ...data } = parsed.data;
    const updateData: any = { ...data };
    if (password) updateData.password_hash = password;
    const updated = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning({
      id: usersTable.id, full_name: usersTable.full_name, email: usersTable.email,
      role: usersTable.role, phone: usersTable.phone, is_active: usersTable.is_active,
      created_at: usersTable.created_at,
    });
    if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
    const u = updated[0];
    res.json({ ...u, created_at: u.created_at instanceof Date ? u.created_at.toISOString() : u.created_at });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).send();
});

export default router;
