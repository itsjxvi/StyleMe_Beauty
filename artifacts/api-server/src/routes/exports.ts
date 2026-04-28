import { Router } from "express";
import { db, usersTable, appointmentsTable, productsTable, paymentsTable, ordersTable, orderItemsTable, activityLogsTable, servicesTable } from "@workspace/db";
import { type AuthedRequest, requireAuth, requirePermission } from "../lib/auth";

const router = Router();

function toCSV(headers: string[], rows: (string | number | null | undefined | Date)[][]): string {
  const escape = (v: any) => {
    if (v == null) return "";
    if (v instanceof Date) return v.toISOString();
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map(r => r.map(escape).join(","))].join("\n");
}

function send(res: any, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\ufeff" + csv);
}

router.get("/exports/clients.csv", requireAuth, requirePermission("users.read"), async (_req, res) => {
  const users = await db.select().from(usersTable);
  const csv = toCSV(
    ["ID", "Nombre", "Email", "Teléfono", "Rol", "Activo", "Creado"],
    users.map(u => [u.id, u.full_name, u.email, u.phone ?? "", u.role, u.is_active ? "Sí" : "No", u.created_at]),
  );
  send(res, "clientes.csv", csv);
});

router.get("/exports/appointments.csv", requireAuth, requirePermission("appointments.read"), async (_req, res) => {
  const apps = await db.select().from(appointmentsTable);
  const services = await db.select().from(servicesTable);
  const sm = new Map(services.map(s => [s.id, s.name]));
  const csv = toCSV(
    ["ID", "Cliente", "Teléfono", "Servicio", "Empleado ID", "Fecha", "Hora", "Estado", "Notas"],
    apps.map(a => [a.id, a.client_name, a.client_phone ?? "", sm.get(a.service_id ?? 0) ?? "", a.employee_id ?? "", a.appointment_date, a.appointment_time, a.status, a.notes ?? ""]),
  );
  send(res, "citas.csv", csv);
});

router.get("/exports/income.csv", requireAuth, requirePermission("payments.read"), async (_req, res) => {
  const payments = await db.select().from(paymentsTable);
  const csv = toCSV(
    ["ID", "Cliente", "Monto", "Método", "Fecha", "Notas"],
    payments.map(p => [p.id, p.client_name ?? "", p.amount, p.payment_method, p.created_at, p.notes ?? ""]),
  );
  send(res, "ingresos.csv", csv);
});

router.get("/exports/products.csv", requireAuth, requirePermission("products.read"), async (_req, res) => {
  const products = await db.select().from(productsTable);
  const csv = toCSV(
    ["ID", "Nombre", "Precio", "Costo", "Stock", "Categoría ID", "Marca ID"],
    products.map(p => [p.id, p.name, p.price, p.cost ?? "", p.stock, p.category_id ?? "", p.brand_id ?? ""]),
  );
  send(res, "productos.csv", csv);
});

router.get("/exports/orders.csv", requireAuth, requirePermission("orders.read"), async (_req, res) => {
  const orders = await db.select().from(ordersTable);
  const items = await db.select().from(orderItemsTable);
  const itemsByOrder: Record<number, string> = {};
  for (const it of items) {
    itemsByOrder[it.order_id] = (itemsByOrder[it.order_id] ? itemsByOrder[it.order_id] + " | " : "") + `${it.product_name} x${it.quantity}`;
  }
  const csv = toCSV(
    ["ID", "Cliente", "Teléfono", "Email", "Productos", "Subtotal", "Descuento", "Envío", "Total", "Pago", "Estado", "Delivery", "Dirección", "Fecha"],
    orders.map(o => [o.id, o.customer_name, o.customer_phone ?? "", o.customer_email ?? "", itemsByOrder[o.id] ?? "", o.subtotal, o.discount, o.delivery_cost, o.total, o.payment_method, o.status, o.is_delivery ? "Sí" : "No", o.delivery_address ?? "", o.created_at]),
  );
  send(res, "ventas.csv", csv);
});

router.get("/exports/activity-logs.csv", requireAuth, requirePermission("logs.read"), async (_req, res) => {
  const logs = await db.select().from(activityLogsTable);
  const csv = toCSV(
    ["ID", "Usuario", "Rol", "Acción", "Entidad", "Entidad ID", "Descripción", "IP", "Fecha"],
    logs.map(l => [l.id, l.user_name ?? "", l.user_role ?? "", l.action, l.entity_type ?? "", l.entity_id ?? "", l.description ?? "", l.ip_address ?? "", l.created_at]),
  );
  send(res, "actividad.csv", csv);
});

export default router;
