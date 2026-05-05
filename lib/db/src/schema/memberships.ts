import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const membershipsTable = pgTable("memberships", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => usersTable.id),
  tier: text("tier").notNull().default("basic"),
  started_at: timestamp("started_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Membership = typeof membershipsTable.$inferSelect;
