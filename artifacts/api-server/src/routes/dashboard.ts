import { Router } from "express";
import { db, appointmentsTable, usersTable, productsTable, invoicesTable, paymentsTable, expensesTable, servicesTable } from "@workspace/db";

const router = Router();

router.get("/dashboard/stats", async (_req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

    const [allAppointments, allUsers, allPayments, allExpenses] = await Promise.all([
      db.select().from(appointmentsTable),
      db.select().from(usersTable),
      db.select().from(paymentsTable),
      db.select().from(expensesTable),
    ]);

    const monthAppts = allAppointments.filter(a => a.appointment_date >= startOfMonthStr);
    const activeClients = allUsers.filter(u => u.is_active !== false);

    const monthlyRevenue = allPayments
      .filter(p => p.created_at >= startOfMonth)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const monthlyExpenses = allExpenses
      .filter(e => e.date >= startOfMonthStr)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const appointmentsByStatus: Record<string, number> = {};
    for (const a of allAppointments) {
      appointmentsByStatus[a.status] = (appointmentsByStatus[a.status] || 0) + 1;
    }

    res.json({
      monthly_revenue: monthlyRevenue,
      monthly_appointments: monthAppts.length,
      active_clients: activeClients.length,
      monthly_expenses: monthlyExpenses,
      appointments_by_status: appointmentsByStatus,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard/recent-appointments", async (_req, res) => {
  try {
    const rows = await db.select().from(appointmentsTable).orderBy(appointmentsTable.id).limit(10);
    const services = await db.select().from(servicesTable);
    const svcMap = Object.fromEntries(services.map(s => [s.id, s.name]));
    const items = rows.map(a => ({
      ...a,
      scheduled_at: `${a.appointment_date}T${a.appointment_time}:00`,
      service_name: a.service_id ? (svcMap[a.service_id] ?? null) : null,
      created_at: a.created_at.toISOString(),
    }));
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard/monthly-profits", async (_req, res) => {
  try {
    const payments = await db.select().from(paymentsTable);
    const expenses = await db.select().from(expensesTable);

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toISOString().slice(0, 7);
    });

    const items = months.map(month => {
      const revenue = payments
        .filter(p => p.created_at.toISOString().startsWith(month))
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const exp = expenses
        .filter(e => e.date.startsWith(month))
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return { month, revenue, expenses: exp, profit: revenue - exp };
    });

    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/dashboard/billing-summary", async (_req, res) => {
  try {
    const [payments, expenses, invoices] = await Promise.all([
      db.select().from(paymentsTable),
      db.select().from(expensesTable),
      db.select().from(invoicesTable),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const pendingInvoices = invoices.filter(i => i.status === "pending").length;

    res.json({
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: totalRevenue - totalExpenses,
      total_invoices: invoices.length,
      pending_invoices: pendingInvoices,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
