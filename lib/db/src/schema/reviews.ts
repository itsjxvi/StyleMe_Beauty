import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  appointment_id: integer("appointment_id"),
  service_id: integer("service_id"),
  employee_id: integer("employee_id"),
  client_name: text("client_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  is_published: integer("is_published").notNull().default(1),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, created_at: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
