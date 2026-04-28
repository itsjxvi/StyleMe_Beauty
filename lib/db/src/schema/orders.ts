import { pgTable, serial, integer, text, timestamp, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"]);
export const orderPaymentMethodEnum = pgEnum("order_payment_method", ["cash", "card", "transfer", "delivery_cash"]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id"),
  customer_name: text("customer_name").notNull(),
  customer_phone: text("customer_phone"),
  customer_email: text("customer_email"),
  is_delivery: boolean("is_delivery").notNull().default(false),
  delivery_address: text("delivery_address"),
  delivery_cost: numeric("delivery_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  promotion_code: text("promotion_code"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  payment_method: orderPaymentMethodEnum("payment_method").notNull().default("cash"),
  status: orderStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").notNull(),
  product_id: integer("product_id").notNull(),
  product_name: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
