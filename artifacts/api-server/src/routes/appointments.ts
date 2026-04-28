import { Router } from "express";
import { db, appointmentsTable, servicesTable, usersTable, serviceProductsTable, productsTable, stockMovementsTable, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { type AuthedRequest, requireAuth, logActivity } from "../lib/auth";

const router = Router();

const BUSINESS_HOURS = { open: 8, close: 20 };
const REST_MINUTES = 10;

function toScheduledAt(row: any) {
  const iso = `${row.appointment_date}T${row.appointment_time}:00`;
  return { ...row, scheduled_at: iso, created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at };
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

async function validateSlot(date: string, time: string, serviceId: number | null, employeeId: number | null, ignoreId?: number) {
  const startMin = toMinutes(time);
  let durationMin = 60;
  if (serviceId) {
    const svc = (await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId)))[0];
    if (svc) durationMin = svc.duration_minutes;
  }
  const endMin = startMin + durationMin;

  if (startMin < BUSINESS_HOURS.open * 60 || endMin > BUSINESS_HOURS.close * 60) {
    return { ok: false, error: `Horario fuera del negocio (${BUSINESS_HOURS.open}:00 - ${BUSINESS_HOURS.close}:00)` };
  }

  if (employeeId) {
    const dayApts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.appointment_date, date));
    const conflict = dayApts.find(a => {
      if (a.id === ignoreId) return false;
      if (a.employee_id !== employeeId) return false;
      if (a.status === "cancelled") return false;
      const aStart = toMinutes(a.appointment_time);
      let aDur = 60;
      const aSvc = a.service_id;
      const fakeSvc = aSvc ? svcDurationCache.get(aSvc) ?? 60 : 60;
      aDur = fakeSvc;
      const aEnd = aStart + aDur;
      return startMin < aEnd + REST_MINUTES && endMin + REST_MINUTES > aStart;
    });
    if (conflict) {
      return { ok: false, error: `El empleado ya tiene una cita a las ${conflict.appointment_time} (descanso mínimo ${REST_MINUTES} min)` };
    }
  }
  return { ok: true };
}

const svcDurationCache = new Map<number, number>();
async function refreshSvcDurationCache() {
  const all = await db.select().from(servicesTable);
  svcDurationCache.clear();
  for (const s of all) svcDurationCache.set(s.id, s.duration_minutes);
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
  service_id: z.coerce.number().int().optional().nullable(),
  employee_id: z.coerce.number().int().optional().nullable(),
  scheduled_at: z.string().optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional().default("pending"),
  notes: z.string().optional().nullable(),
});

router.post("/appointments", requireAuth, async (req: AuthedRequest, res) => {
  try {
    await refreshSvcDurationCache();
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues }); return; }
    const d = parsed.data;
    let date = d.appointment_date || "";
    let time = d.appointment_time || "00:00";
    if (d.scheduled_at) {
      const dt = new Date(d.scheduled_at);
      date = dt.toISOString().split("T")[0];
      time = dt.toTimeString().slice(0, 5);
    }
    const valid = await validateSlot(date, time, d.service_id ?? null, d.employee_id ?? null);
    if (!valid.ok) { res.status(400).json({ error: valid.error }); return; }

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
    await logActivity(req, "create", "appointment", a.id, `Cita creada para ${d.client_name} el ${date} ${time}`);
    res.status(201).json({ ...toScheduledAt(a), service_name: null, employee_name: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const updateAppointmentSchema = z.object({
  client_name: z.string().optional(),
  client_phone: z.string().optional().nullable(),
  service_id: z.coerce.number().int().optional().nullable(),
  employee_id: z.coerce.number().int().optional().nullable(),
  scheduled_at: z.string().optional(),
  appointment_date: z.string().optional(),
  appointment_time: z.string().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().optional().nullable(),
});

router.put("/appointments/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    await refreshSvcDurationCache();
    const id = parseInt(req.params.id);
    const parsed = updateAppointmentSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Datos inválidos" }); return; }
    const d = parsed.data;
    const existing = (await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)))[0];
    if (!existing) { res.status(404).json({ error: "No encontrada" }); return; }
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
    const newDate = updateData.appointment_date ?? existing.appointment_date;
    const newTime = updateData.appointment_time ?? existing.appointment_time;
    const newSvc = updateData.service_id ?? existing.service_id;
    const newEmp = updateData.employee_id ?? existing.employee_id;
    if (updateData.appointment_date || updateData.appointment_time || updateData.service_id !== undefined || updateData.employee_id !== undefined) {
      const valid = await validateSlot(newDate, newTime, newSvc, newEmp, id);
      if (!valid.ok) { res.status(400).json({ error: valid.error }); return; }
    }
    const updated = await db.update(appointmentsTable).set(updateData).where(eq(appointmentsTable.id, id)).returning();
    const a = updated[0];
    await logActivity(req, "update", "appointment", id, `Cita #${id} actualizada`);
    res.json({ ...toScheduledAt(a), service_name: null, employee_name: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/appointments/:id/complete", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const apt = (await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)))[0];
    if (!apt) { res.status(404).json({ error: "No encontrada" }); return; }

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
    await logActivity(req, "complete", "appointment", id, `Cita de ${apt.client_name} completada`);

    const a = updated[0];
    res.json({ ...toScheduledAt(a), service_name: null, employee_name: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/appointments/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    await logActivity(req, "delete", "appointment", id, `Cita #${id} eliminada`);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/appointments/availability", async (req, res) => {
  const date = req.query.date as string;
  const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : null;
  if (!date) { res.status(400).json({ error: "date requerido" }); return; }
  await refreshSvcDurationCache();
  const apts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.appointment_date, date));
  const slots: { time: string; available: boolean }[] = [];
  for (let h = BUSINESS_HOURS.open; h < BUSINESS_HOURS.close; h++) {
    for (const m of [0, 30]) {
      const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const slotStart = toMinutes(t);
      const slotEnd = slotStart + 30;
      const occupied = apts.some(a => {
        if (employeeId && a.employee_id !== employeeId) return false;
        if (a.status === "cancelled") return false;
        const aStart = toMinutes(a.appointment_time);
        const aDur = a.service_id ? (svcDurationCache.get(a.service_id) ?? 60) : 60;
        const aEnd = aStart + aDur;
        return slotStart < aEnd + REST_MINUTES && slotEnd + REST_MINUTES > aStart;
      });
      slots.push({ time: t, available: !occupied });
    }
  }
  res.json({ date, business_hours: BUSINESS_HOURS, rest_minutes: REST_MINUTES, slots });
});

export default router;
