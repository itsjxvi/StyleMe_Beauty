import { pgTable, serial, text, timestamp, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";

export const promotionTypeEnum = pgEnum("promotion_type", ["percent", "amount"]);
export const promotionAppliesEnum = pgEnum("promotion_applies", ["all", "products", "services"]);

export const promotionsTable = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").unique(),
  type: promotionTypeEnum("type").notNull().default("percent"),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  applies_to: promotionAppliesEnum("applies_to").notNull().default("all"),
  min_amount: numeric("min_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  starts_at: timestamp("starts_at"),
  ends_at: timestamp("ends_at"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export type Promotion = typeof promotionsTable.$inferSelect;
