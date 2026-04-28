import { Router } from "express";
import { db, activityLogsTable } from "@workspace/db";
import { sql, eq, and } from "drizzle-orm";
import { type AuthedRequest, requireAuth, requirePermission } from "../lib/auth";

const router = Router();

router.get("/activity-logs", requireAuth, requirePermission("logs.read"), async (req: AuthedRequest, res) => {
  const { entity_type, action, user_id, limit = "200" } = req.query as any;
  const filters: any[] = [];
  if (entity_type) filters.push(eq(activityLogsTable.entity_type, String(entity_type)));
  if (action) filters.push(eq(activityLogsTable.action, String(action)));
  if (user_id) filters.push(eq(activityLogsTable.user_id, parseInt(String(user_id))));
  const where = filters.length ? and(...filters) : undefined;
  const rows = await db.select().from(activityLogsTable)
    .where(where as any)
    .orderBy(sql`${activityLogsTable.created_at} desc`)
    .limit(parseInt(String(limit)));
  res.json({ items: rows });
});

router.get("/activity-logs/summary", requireAuth, requirePermission("logs.read"), async (_req, res) => {
  const rows = await db.select().from(activityLogsTable);
  const byUser: Record<string, number> = {};
  const byEntity: Record<string, number> = {};
  const byAction: Record<string, number> = {};
  for (const r of rows) {
    if (r.user_name) byUser[r.user_name] = (byUser[r.user_name] || 0) + 1;
    if (r.entity_type) byEntity[r.entity_type] = (byEntity[r.entity_type] || 0) + 1;
    byAction[r.action] = (byAction[r.action] || 0) + 1;
  }
  res.json({
    total: rows.length,
    by_user: Object.entries(byUser).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    by_entity: Object.entries(byEntity).map(([entity, count]) => ({ entity, count })),
    by_action: Object.entries(byAction).map(([action, count]) => ({ action, count })),
  });
});

export default router;
