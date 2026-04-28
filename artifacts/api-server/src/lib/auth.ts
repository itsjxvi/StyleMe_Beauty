import type { Request, Response, NextFunction } from "express";
import { db, usersTable, activityLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthedRequest extends Request {
  user?: {
    id: number;
    full_name: string;
    email: string;
    role: "admin" | "employee" | "client";
  };
}

export async function loadUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (auth) {
    const tokenParts = auth.replace("Bearer ", "").split("-");
    const userId = parseInt(tokenParts[1]);
    if (!isNaN(userId)) {
      const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (users[0]) {
        const u = users[0];
        req.user = { id: u.id, full_name: u.full_name, email: u.email, role: u.role as any };
      }
    }
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Inicia sesión para realizar esta acción" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "No tienes permiso para esta acción" });
      return;
    }
    next();
  };
}

const PERMISSIONS: Record<string, string[]> = {
  admin: ["*"],
  employee: [
    "appointments.read", "appointments.create", "appointments.update", "appointments.complete",
    "products.read", "services.read", "categories.read", "brands.read", "providers.read",
    "stock.read", "stock.create",
    "invoices.read", "invoices.create",
    "payments.read", "payments.create",
    "reviews.read",
    "orders.read", "orders.update",
    "users.read",
    "reports.read",
    "logs.read.own",
    "promotions.read",
    "notifications.read", "notifications.update",
    "dashboard.read",
  ],
  client: [
    "appointments.create", "appointments.read.own",
    "orders.create", "orders.read.own",
    "products.read", "services.read",
  ],
};

export function hasPermission(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  const perms = PERMISSIONS[role] ?? [];
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function requirePermission(permission: string) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Inicia sesión para realizar esta acción" });
      return;
    }
    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({ error: `Permiso requerido: ${permission}` });
      return;
    }
    next();
  };
}

export async function logActivity(
  req: AuthedRequest,
  action: string,
  entity_type: string | null,
  entity_id: number | null,
  description: string,
) {
  try {
    await db.insert(activityLogsTable).values({
      user_id: req.user?.id ?? null,
      user_name: req.user?.full_name ?? "Sistema",
      user_role: req.user?.role ?? null,
      action,
      entity_type,
      entity_id,
      description,
      ip_address: (req.ip || req.headers["x-forwarded-for"]?.toString() || null) as any,
    });
  } catch (e) {
    // never break a request because logging failed
  }
}
