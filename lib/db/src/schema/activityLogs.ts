import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  user_name: text("user_name"),
  user_role: text("user_role"),
  action: text("action").notNull(),
  entity_type: text("entity_type"),
  entity_id: integer("entity_id"),
  description: text("description"),
  ip_address: text("ip_address"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;
