import { Router } from "express";
import { db, reviewsTable, servicesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

function serializeReview(r: any, svcMap: Record<number, string>, usrMap: Record<number, string>) {
  return {
    ...r,
    service_name: r.service_id ? svcMap[r.service_id] ?? null : null,
    employee_name: r.employee_id ? usrMap[r.employee_id] ?? null : null,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}

router.get("/reviews", async (req, res) => {
  try {
    const { service_id, employee_id, published_only } = req.query as any;
    let rows = await db.select().from(reviewsTable).orderBy(desc(reviewsTable.id));
    if (service_id) rows = rows.filter(r => r.service_id === parseInt(service_id));
    if (employee_id) rows = rows.filter(r => r.employee_id === parseInt(employee_id));
    if (published_only === "true") rows = rows.filter(r => r.is_published === 1);

    const services = await db.select().from(servicesTable);
    const users = await db.select().from(usersTable);
    const svcMap = Object.fromEntries(services.map(s => [s.id, s.name]));
    const usrMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));

    const items = rows.map(r => serializeReview(r, svcMap, usrMap));
    const average = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;
    res.json({ items, average, total: items.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const createSchema = z.object({
  appointment_id: z.number().int().nullable().optional(),
  service_id: z.number().int().nullable().optional(),
  employee_id: z.number().int().nullable().optional(),
  client_name: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
});

router.post("/reviews", async (req, res) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const inserted = await db.insert(reviewsTable).values({
      appointment_id: parsed.data.appointment_id ?? null,
      service_id: parsed.data.service_id ?? null,
      employee_id: parsed.data.employee_id ?? null,
      client_name: parsed.data.client_name,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      is_published: 1,
    }).returning();
    const r = inserted[0];

    await db.insert(notificationsTable).values({
      type: "review",
      title: "Nueva reseña recibida",
      message: `${r.client_name} dejó una reseña de ${r.rating} estrellas`,
      related_id: r.id,
    });

    res.status(201).json({ ...r, service_name: null, employee_name: null, created_at: r.created_at.toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().nullable().optional(),
  is_published: z.number().int().optional(),
});

router.put("/reviews/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }
    const updateData: any = {};
    if (parsed.data.rating !== undefined) updateData.rating = parsed.data.rating;
    if (parsed.data.comment !== undefined) updateData.comment = parsed.data.comment;
    if (parsed.data.is_published !== undefined) updateData.is_published = parsed.data.is_published;
    const updated = await db.update(reviewsTable).set(updateData).where(eq(reviewsTable.id, id)).returning();
    if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
    const r = updated[0];
    res.json({ ...r, service_name: null, employee_name: null, created_at: r.created_at.toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/reviews/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/reviews/stats", async (_req, res) => {
  try {
    const reviews = await db.select().from(reviewsTable);
    const services = await db.select().from(servicesTable);
    const users = await db.select().from(usersTable);

    const overall_average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    const svcAgg: Record<number, { sum: number; count: number; name: string }> = {};
    for (const r of reviews) {
      if (r.service_id) {
        if (!svcAgg[r.service_id]) {
          const svc = services.find(s => s.id === r.service_id);
          svcAgg[r.service_id] = { sum: 0, count: 0, name: svc?.name ?? `Servicio #${r.service_id}` };
        }
        svcAgg[r.service_id].sum += r.rating;
        svcAgg[r.service_id].count += 1;
      }
    }
    const by_service = Object.entries(svcAgg).map(([id, v]) => ({
      service_id: parseInt(id),
      service_name: v.name,
      average: v.sum / v.count,
      count: v.count,
    }));

    const empAgg: Record<number, { sum: number; count: number; name: string }> = {};
    for (const r of reviews) {
      if (r.employee_id) {
        if (!empAgg[r.employee_id]) {
          const u = users.find(x => x.id === r.employee_id);
          empAgg[r.employee_id] = { sum: 0, count: 0, name: u?.full_name ?? `Empleado #${r.employee_id}` };
        }
        empAgg[r.employee_id].sum += r.rating;
        empAgg[r.employee_id].count += 1;
      }
    }
    const by_employee = Object.entries(empAgg).map(([id, v]) => ({
      employee_id: parseInt(id),
      employee_name: v.name,
      average: v.sum / v.count,
      count: v.count,
    }));

    res.json({ overall_average, total_reviews: reviews.length, by_service, by_employee });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
