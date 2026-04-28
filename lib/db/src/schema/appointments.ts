import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentStatusEnum = pgEnum("appointment_status", ["pending", "confirmed", "completed", "cancelled"]);

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  client_name: text("client_name").notNull(),
  client_phone: text("client_phone"),
  service_id: integer("service_id"),
  employee_id: integer("employee_id"),
  appointment_date: text("appointment_date").notNull(),
  appointment_time: text("appointment_time").notNull(),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, created_at: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
