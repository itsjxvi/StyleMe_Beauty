import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockMovementTypeEnum = pgEnum("stock_movement_type", ["in", "out", "adjustment"]);

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull(),
  movement_type: stockMovementTypeEnum("movement_type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertStockMovementSchema = createInsertSchema(stockMovementsTable).omit({ id: true, created_at: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovementsTable.$inferSelect;
