import { useGetDashboardStats, useGetBillingSummary, useGetRecentAppointments, useListServices } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, Users, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function StatCard({ title, value, subtitle, icon, color = "primary" }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "primary" | "green" | "red" | "blue";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: billing, isLoading: billingLoading } = useGetBillingSummary();
  const { data: recentApts, isLoading: recentsLoading } = useGetRecentAppointments();
  const { data: servicesData } = useListServices();
  const services = servicesData?.items ?? [];

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada"
  };
  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-400", confirmed: "bg-blue-400", completed: "bg-green-500", cancelled: "bg-red-400"
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen general del negocio</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6 h-24" /></Card>
            ))
          ) : (
            <>
              <StatCard
                title="Ingresos (mes)"
                value={`$${Number(stats?.monthly_revenue ?? 0).toLocaleString()}`}
                subtitle="Total del mes actual"
                icon={<DollarSign size={18} />}
                color="green"
              />
              <StatCard
                title="Citas (mes)"
                value={stats?.monthly_appointments ?? 0}
                subtitle="Citas del mes"
                icon={<Calendar size={18} />}
                color="primary"
              />
              <StatCard
                title="Clientes activos"
                value={stats?.active_clients ?? 0}
                subtitle="Total de clientes"
                icon={<Users size={18} />}
                color="blue"
              />
              <StatCard
                title="Gastos (mes)"
                value={`$${Number(stats?.monthly_expenses ?? 0).toLocaleString()}`}
                subtitle="Total de gastos"
                icon={<TrendingDown size={18} />}
                color="red"
              />
            </>
          )}
        </div>

        {/* Billing + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              {billingLoading ? (
                <div className="h-48 animate-pulse bg-muted rounded-lg" />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Total Ingresos</span>
                    <span className="font-semibold text-green-600">${Number(billing?.total_revenue ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Total Gastos</span>
                    <span className="font-semibold text-red-500">${Number(billing?.total_expenses ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Total Facturas</span>
                    <span className="font-semibold">{billing?.total_invoices ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Facturas Pendientes</span>
                    <span className="font-semibold text-yellow-600">{billing?.pending_invoices ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium">Ganancia Neta</span>
                    <span className={`font-bold text-lg ${(Number(billing?.net_profit ?? 0)) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${Number(billing?.net_profit ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Citas por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-48 animate-pulse bg-muted rounded-lg" />
              ) : (
                <div className="space-y-3 mt-2">
                  {Object.entries(stats?.appointments_by_status ?? {}).map(([status, count]) => {
                    const total = Object.values(stats?.appointments_by_status ?? {}).reduce((a, b) => a + (b as number), 0) || 1;
                    const pct = Math.round((count as number) / total * 100);
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{STATUS_LABELS[status] || status}</span>
                          <span className="font-medium">{count as number} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full">
                          <div className={`h-2 rounded-full ${STATUS_COLORS[status] || "bg-primary"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Appointments */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Citas Recientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cliente</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Servicio</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {((recentApts as any[]) ?? []).slice(0, 10).map((apt: any) => {
                      const d = new Date(apt.scheduled_at);
                      const svc = services.find(s => s.id === apt.service_id);
                      return (
                        <tr key={apt.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 font-medium">{apt.client_name}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{svc?.name ?? "-"}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{d.toLocaleDateString("es-CR")}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                              apt.status === "pending" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                              apt.status === "confirmed" ? "bg-blue-100 text-blue-700 border-blue-200" :
                              apt.status === "completed" ? "bg-green-100 text-green-700 border-green-200" :
                              "bg-red-100 text-red-700 border-red-200"
                            }`}>
                              {STATUS_LABELS[apt.status] || apt.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!recentApts || (recentApts as any[]).length === 0) && (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">Sin citas recientes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
