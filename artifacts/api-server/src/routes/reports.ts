import { Router } from "express";
import { db, paymentsTable, appointmentsTable, servicesTable } from "@workspace/db";

const router = Router();

router.get("/reports/income", async (req, res) => {
  try {
    const period = (req.query.period as string) || "day";
    const payments = await db.select().from(paymentsTable);
    const groups: Record<string, { revenue: number; count: number }> = {};

    for (const p of payments) {
      const d = p.created_at;
      const key = period === "month" ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = { revenue: 0, count: 0 };
      groups[key].revenue += Number(p.amount);
      groups[key].count += 1;
    }

    const items = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, v]) => ({ period, revenue: v.revenue, count: v.count }));

    const total = items.reduce((s, x) => s + x.revenue, 0);
    res.json({ items, total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/reports/top-services", async (_req, res) => {
  try {
    const appointments = await db.select().from(appointmentsTable);
    const services = await db.select().from(servicesTable);
    const svcMap = Object.fromEntries(services.map(s => [s.id, s]));

    const agg: Record<number, { count: number; revenue: number; name: string }> = {};
    for (const a of appointments) {
      if (!a.service_id) continue;
      if (!agg[a.service_id]) {
        const svc = svcMap[a.service_id];
        agg[a.service_id] = { count: 0, revenue: 0, name: svc?.name ?? `Servicio #${a.service_id}` };
      }
      agg[a.service_id].count += 1;
      if (a.status === "completed") {
        agg[a.service_id].revenue += Number(svcMap[a.service_id]?.price ?? 0);
      }
    }

    const items = Object.entries(agg)
      .map(([id, v]) => ({ service_id: parseInt(id), service_name: v.name, count: v.count, revenue: v.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/reports/frequent-clients", async (_req, res) => {
  try {
    const appointments = await db.select().from(appointmentsTable);
    const services = await db.select().from(servicesTable);
    const payments = await db.select().from(paymentsTable);
    const svcMap = Object.fromEntries(services.map(s => [s.id, s]));

    const agg: Record<string, { appointment_count: number; total_spent: number }> = {};
    for (const a of appointments) {
      if (!agg[a.client_name]) agg[a.client_name] = { appointment_count: 0, total_spent: 0 };
      agg[a.client_name].appointment_count += 1;
      if (a.status === "completed" && a.service_id && svcMap[a.service_id]) {
        agg[a.client_name].total_spent += Number(svcMap[a.service_id].price);
      }
    }
    for (const p of payments) {
      if (p.client_name) {
        if (!agg[p.client_name]) agg[p.client_name] = { appointment_count: 0, total_spent: 0 };
        agg[p.client_name].total_spent += Number(p.amount);
      }
    }

    const items = Object.entries(agg)
      .map(([client_name, v]) => ({ client_name, ...v }))
      .sort((a, b) => b.appointment_count - a.appointment_count)
      .slice(0, 10);

    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
