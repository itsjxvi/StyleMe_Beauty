import { Router } from "express";
import { db, appointmentsTable, servicesTable, usersTable, serviceProductsTable, productsTable, stockMovementsTable, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function toScheduledAt(row: any) {
  const iso = `${row.appointment_date}T${row.appointment_time}:00`;
  return { ...row, scheduled_at: iso, created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at };
}

router.get("/appointments", async (req, res) => {
  try {
    let rows = await db.select().from(appointmentsTable).orderBy(appointmentsTable.id);
    const { search, status } = req.query as any;
    if (search) rows = rows.filter(r => r.client_name.toLowerCase().includes(search.toLowerCase()));
    if (status && status !== "all") rows = rows.filter(r => r.status === status);

    const services = await db.select().from(servicesTable);
    const users = await db.select().from(usersTable);
    const svcMap = Object.fromEntries(services.map(s => [s.id, s.name]));
    const usrMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));

    const items = rows.map(a => ({
      ...toScheduledAt(a),
      service_name: a.service_id ? (svcMap[a.service_id] ?? null) : null,
      employee_name: a.employee_id ? (usrMap[a.employee_id] ?? null) : null,
    }));
    res.json({ items, total: items.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const createAppointmentSchema = z.object({
  client_name: z.string().min(1),
  client_phone: z.string().optional().nullable(),
  service_id: z.number().int().optional().nullable(),
  employee_id: z.number().int().optional().nullable(),
  scheduled_at: z.string().optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional().default("pending"),
  notes: z.string().optional().nullable(),
});

router.post("/appointments", async (req, res) => {
  try {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request", details: parsed.error }); return; }
    const d = parsed.data;
    let date = d.appointment_date || "";
    let time = d.appointment_time || "00:00";
    if (d.scheduled_at) {
      const dt = new Date(d.scheduled_at);
      date = dt.toISOString().split("T")[0];
      time = dt.toTimeString().slice(0, 5);
    }
    const inserted = await db.insert(appointmentsTable).values({
      client_name: d.client_name,
      client_phone: d.client_phone ?? null,
      service_id: d.service_id ?? null,
      employee_id: d.employee_id ?? null,
      appointment_date: date,
      appointment_time: time,
      status: d.status ?? "pending",
      notes: d.notes ?? null,
    }).returning();
    const a = inserted[0];
    res.status(201).json({ ...toScheduledAt(a), service_name: null, employee_name: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const updateAppointmentSchema = z.object({
  client_name: z.string().optional(),
  client_phone: z.string().optional().nullable(),
  service_id: z.number().int().optional().nullable(),
  employee_id: z.number().int().optional().nullable(),
  scheduled_at: z.string().optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().optional().nullable(),
});

router.put("/appointments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = updateAppointmentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const d = parsed.data;
    const updateData: any = {};
    if (d.client_name) updateData.client_name = d.client_name;
    if (d.client_phone !== undefined) updateData.client_phone = d.client_phone;
    if (d.service_id !== undefined) updateData.service_id = d.service_id;
    if (d.employee_id !== undefined) updateData.employee_id = d.employee_id;
    if (d.notes !== undefined) updateData.notes = d.notes;
    if (d.status) updateData.status = d.status;
    if (d.scheduled_at) {
      const dt = new Date(d.scheduled_at);
      updateData.appointment_date = dt.toISOString().split("T")[0];
      updateData.appointment_time = dt.toTimeString().slice(0, 5);
    } else {
      if (d.appointment_date) updateData.appointment_date = d.appointment_date;
      if (d.appointment_time) updateData.appointment_time = d.appointment_time;
    }
    const updated = await db.update(appointmentsTable).set(updateData).where(eq(appointmentsTable.id, id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
    const a = updated[0];
    res.json({ ...toScheduledAt(a), service_name: null, employee_name: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/appointments/:id/complete", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const apt = (await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)))[0];
    if (!apt) { res.status(404).json({ error: "Not found" }); return; }

    const updated = await db.update(appointmentsTable).set({ status: "completed" }).where(eq(appointmentsTable.id, id)).returning();

    if (apt.service_id) {
      const links = await db.select().from(serviceProductsTable).where(eq(serviceProductsTable.service_id, apt.service_id));
      for (const link of links) {
        await db.update(productsTable).set({ stock: sql`${productsTable.stock} - ${link.quantity}` }).where(eq(productsTable.id, link.product_id));
        await db.insert(stockMovementsTable).values({
          product_id: link.product_id,
          movement_type: "out",
          quantity: link.quantity,
          reason: `Cita #${id} completada`,
        });

        const prod = (await db.select().from(productsTable).where(eq(productsTable.id, link.product_id)))[0];
        if (prod && prod.stock <= 5) {
          await db.insert(notificationsTable).values({
            type: "low_stock",
            title: "Stock bajo",
            message: `${prod.name} tiene solo ${prod.stock} unidades disponibles`,
            related_id: prod.id,
          });
        }
      }
    }

    await db.insert(notificationsTable).values({
      type: "confirmation",
      title: "Cita completada",
      message: `Cita de ${apt.client_name} marcada como completada`,
      related_id: id,
    });

    const a = updated[0];
    res.json({ ...toScheduledAt(a), service_name: null, employee_name: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/appointments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
