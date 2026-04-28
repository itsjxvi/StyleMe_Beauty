import { Router } from "express";
import { db, usersTable } from "@workspace/db";
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
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { email, password } = parsed.data;
  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = users[0];
  if (!user || user.password_hash !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const { password_hash: _, ...safeUser } = user;
  res.json({ user: safeUser, token: `token-${user.id}` });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

router.get("/auth/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const tokenParts = auth.replace("Bearer ", "").split("-");
  const userId = parseInt(tokenParts[1]);
  if (isNaN(userId)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { password_hash: _, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
