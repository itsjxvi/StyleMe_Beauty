import { pgTable, serial, integer, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "transfer"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoice_id: integer("invoice_id"),
  appointment_id: integer("appointment_id"),
  client_name: text("client_name"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum("payment_method").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, created_at: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
