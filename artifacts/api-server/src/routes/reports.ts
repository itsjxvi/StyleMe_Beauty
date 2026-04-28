import { Router } from "express";
import {
  db, paymentsTable, appointmentsTable, servicesTable,
  ordersTable, orderItemsTable, productsTable, usersTable,
} from "@workspace/db";

const router = Router();

router.get("/reports/income", async (req, res) => {
  try {
    const period = (req.query.period as string) || "day";
    const payments = await db.select().from(paymentsTable);
    const orders = await db.select().from(ordersTable);
    const groups: Record<string, { revenue: number; count: number }> = {};

    for (const p of payments) {
      const d = p.created_at;
      const key = period === "month" ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = { revenue: 0, count: 0 };
      groups[key].revenue += Number(p.amount);
      groups[key].count += 1;
    }
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const d = o.created_at;
      const key = period === "month" ? d.toISOString().slice(0, 7) : d.toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = { revenue: 0, count: 0 };
      groups[key].revenue += Number(o.total);
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

// Servicio más rentable: profit = revenue - (sum of supplies * cost)
router.get("/reports/profitability", async (_req, res) => {
  const appointments = await db.select().from(appointmentsTable);
  const services = await db.select().from(servicesTable);
  const orderItems = await db.select().from(orderItemsTable);
  const orders = await db.select().from(ordersTable);
  const products = await db.select().from(productsTable);
  const productMap = new Map(products.map(p => [p.id, p]));

  const services_items = services.map(s => {
    const completed = appointments.filter(a => a.service_id === s.id && a.status === "completed");
    const revenue = completed.length * Number(s.price);
    const cost = 0;
    return {
      service_id: s.id, service_name: s.name,
      count: completed.length, revenue, cost, profit: revenue - cost,
      margin: revenue ? ((revenue - cost) / revenue) * 100 : 0,
    };
  }).sort((a, b) => b.profit - a.profit);

  const productAgg: Record<number, { count: number; revenue: number; cost: number }> = {};
  for (const it of orderItems) {
    const o = orders.find(x => x.id === it.order_id);
    if (o && o.status === "cancelled") continue;
    const p = productMap.get(it.product_id);
    if (!productAgg[it.product_id]) productAgg[it.product_id] = { count: 0, revenue: 0, cost: 0 };
    productAgg[it.product_id].count += it.quantity;
    productAgg[it.product_id].revenue += Number(it.subtotal);
    productAgg[it.product_id].cost += it.quantity * Number(p?.cost ?? 0);
  }
  const products_items = Object.entries(productAgg).map(([id, v]) => {
    const p = productMap.get(parseInt(id));
    return {
      product_id: parseInt(id),
      product_name: p?.name ?? `Producto #${id}`,
      count: v.count, revenue: v.revenue, cost: v.cost,
      profit: v.revenue - v.cost,
      margin: v.revenue ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
    };
  }).sort((a, b) => b.profit - a.profit);

  res.json({ services: services_items, products: products_items });
});

// Empleado más productivo
router.get("/reports/employees-performance", async (_req, res) => {
  const appointments = await db.select().from(appointmentsTable);
  const services = await db.select().from(servicesTable);
  const users = await db.select().from(usersTable);
  const svcMap = new Map(services.map(s => [s.id, s]));

  const agg: Record<number, { appointments: number; completed: number; revenue: number; profit: number }> = {};
  for (const a of appointments) {
    if (!a.employee_id) continue;
    if (!agg[a.employee_id]) agg[a.employee_id] = { appointments: 0, completed: 0, revenue: 0, profit: 0 };
    agg[a.employee_id].appointments += 1;
    if (a.status === "completed" && a.service_id && svcMap.has(a.service_id)) {
      const svc = svcMap.get(a.service_id)!;
      agg[a.employee_id].completed += 1;
      agg[a.employee_id].revenue += Number(svc.price);
      agg[a.employee_id].profit += Number(svc.price);
    }
  }
  const items = Object.entries(agg).map(([id, v]) => {
    const u = users.find(x => x.id === parseInt(id));
    return {
      employee_id: parseInt(id),
      employee_name: u?.full_name ?? `Empleado #${id}`,
      appointments: v.appointments,
      completed: v.completed,
      completion_rate: v.appointments ? (v.completed / v.appointments) * 100 : 0,
      revenue: v.revenue,
      profit: v.profit,
    };
  }).sort((a, b) => b.revenue - a.revenue);
  res.json({ items });
});

// Horas más rentables
router.get("/reports/peak-hours", async (_req, res) => {
  const appointments = await db.select().from(appointmentsTable);
  const services = await db.select().from(servicesTable);
  const svcMap = new Map(services.map(s => [s.id, s]));

  const byHour: Record<number, { count: number; revenue: number }> = {};
  const byDay: Record<number, { count: number; revenue: number }> = {};
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  for (const a of appointments) {
    const hour = parseInt(String(a.appointment_time).slice(0, 2));
    const dow = new Date(`${a.appointment_date}T00:00:00`).getDay();
    byHour[hour] = byHour[hour] || { count: 0, revenue: 0 };
    byDay[dow] = byDay[dow] || { count: 0, revenue: 0 };
    byHour[hour].count += 1;
    byDay[dow].count += 1;
    if (a.status === "completed" && a.service_id && svcMap.has(a.service_id)) {
      const r = Number(svcMap.get(a.service_id)!.price);
      byHour[hour].revenue += r;
      byDay[dow].revenue += r;
    }
  }
  res.json({
    by_hour: Object.entries(byHour).map(([h, v]) => ({ hour: parseInt(h), label: `${h.padStart(2, "0")}:00`, ...v })).sort((a, b) => a.hour - b.hour),
    by_day: Object.entries(byDay).map(([d, v]) => ({ day: parseInt(d), label: dayNames[parseInt(d)], ...v })).sort((a, b) => a.day - b.day),
  });
});

// Clientes que más gastan
router.get("/reports/top-spenders", async (_req, res) => {
  const orders = await db.select().from(ordersTable);
  const payments = await db.select().from(paymentsTable);
  const appointments = await db.select().from(appointmentsTable);
  const services = await db.select().from(servicesTable);
  const svcMap = new Map(services.map(s => [s.id, s]));

  const agg: Record<string, { spent: number; orders: number; appointments: number; phone: string | null }> = {};
  const get = (name: string, phone?: string | null) => {
    if (!agg[name]) agg[name] = { spent: 0, orders: 0, appointments: 0, phone: phone ?? null };
    if (phone && !agg[name].phone) agg[name].phone = phone;
    return agg[name];
  };
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const r = get(o.customer_name, o.customer_phone);
    r.spent += Number(o.total);
    r.orders += 1;
  }
  for (const p of payments) {
    if (p.client_name) get(p.client_name).spent += Number(p.amount);
  }
  for (const a of appointments) {
    const r = get(a.client_name, a.client_phone);
    r.appointments += 1;
    if (a.status === "completed" && a.service_id && svcMap.has(a.service_id)) {
      r.spent += Number(svcMap.get(a.service_id)!.price);
    }
  }
  const items = Object.entries(agg)
    .map(([name, v]) => ({ client_name: name, ...v }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 20);
  res.json({ items });
});

export default router;
