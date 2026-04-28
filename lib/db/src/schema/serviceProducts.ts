import { pgTable, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceProductsTable = pgTable("service_products", {
  id: serial("id").primaryKey(),
  service_id: integer("service_id").notNull(),
  product_id: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const insertServiceProductSchema = createInsertSchema(serviceProductsTable).omit({ id: true });
export type InsertServiceProduct = z.infer<typeof insertServiceProductSchema>;
export type ServiceProduct = typeof serviceProductsTable.$inferSelect;
