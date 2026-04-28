import { useEffect, useState } from "react";
import { useGetIncomeReport } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Award, Clock, Crown, Download, DollarSign, Users } from "lucide-react";
import { apiFetch, downloadCsv } from "@/lib/apiFetch";

export default function Reports() {
  const [period, setPeriod] = useState<"day" | "month">("day");
  const { data: income } = useGetIncomeReport({ period });
  const [profit, setProfit] = useState<any>({ services: [], products: [] });
  const [employees, setEmployees] = useState<any[]>([]);
  const [hours, setHours] = useState<any>({ by_hour: [], by_day: [] });
  const [spenders, setSpenders] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/reports/profitability").then(setProfit).catch(() => {});
    apiFetch("/reports/employees-performance").then(r => setEmployees(r.items ?? [])).catch(() => {});
    apiFetch("/reports/peak-hours").then(setHours).catch(() => {});
    apiFetch("/reports/top-spenders").then(r => setSpenders(r.items ?? [])).catch(() => {});
  }, []);

  const topService = profit.services?.[0];
  const topEmployee = employees[0];
  const peakHour = [...(hours.by_hour ?? [])].sort((a, b) => b.revenue - a.revenue)[0];
  const topSpender = spenders[0];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl font-bold">Reportes inteligentes</h1>
            <p className="text-sm text-muted-foreground">Analítica avanzada del negocio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadCsv("/exports/income.csv", "ingresos.csv")}><Download size={14} className="mr-1" />Ingresos</Button>
            <Button size="sm" variant="outline" onClick={() => downloadCsv("/exports/clients.csv", "clientes.csv")}><Download size={14} className="mr-1" />Clientes</Button>
            <Button size="sm" variant="outline" onClick={() => downloadCsv("/exports/appointments.csv", "citas.csv")}><Download size={14} className="mr-1" />Citas</Button>
            <Button size="sm" variant="outline" onClick={() => downloadCsv("/exports/orders.csv", "ventas.csv")}><Download size={14} className="mr-1" />Ventas</Button>
            <Button size="sm" variant="outline" onClick={() => downloadCsv("/exports/products.csv", "productos.csv")}><Download size={14} className="mr-1" />Productos</Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Ingresos totales</p>
                <DollarSign size={18} className="text-green-600" />
              </div>
              <p className="text-3xl font-bold mt-2">${(income?.total ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Servicio más rentable</p>
                <Award size={18} className="text-amber-500" />
              </div>
              <p className="text-lg font-bold mt-2 truncate">{topService?.service_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">${Number(topService?.profit ?? 0).toFixed(2)} ganancia</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Empleado top</p>
                <Crown size={18} className="text-purple-600" />
              </div>
              <p className="text-lg font-bold mt-2 truncate">{topEmployee?.employee_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">${Number(topEmployee?.revenue ?? 0).toFixed(2)} · {topEmployee?.completed ?? 0} completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Hora pico</p>
                <Clock size={18} className="text-blue-600" />
              </div>
              <p className="text-lg font-bold mt-2">{peakHour?.label ?? "—"}</p>
              <p className="text-xs text-muted-foreground">${Number(peakHour?.revenue ?? 0).toFixed(2)} · {peakHour?.count ?? 0} citas</p>
            </CardContent>
          </Card>
        </div>

        {/* Income chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Ingresos por {period === "day" ? "día" : "mes"}</CardTitle>
            <div className="flex bg-muted rounded-lg p-1">
              <button onClick={() => setPeriod("day")} className={`px-3 py-1 text-xs rounded-md ${period === "day" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>Día</button>
              <button onClick={() => setPeriod("month")} className={`px-3 py-1 text-xs rounded-md ${period === "month" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>Mes</button>
            </div>
          </CardHeader>
          <CardContent>
            {(income?.items?.length ?? 0) === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={income?.items ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Profitability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award size={18} />Servicios más rentables</CardTitle></CardHeader>
            <CardContent>
              {(profit.services ?? []).length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p> :
                <div className="divide-y divide-border">
                  {profit.services.slice(0, 8).map((s: any, i: number) => (
                    <div key={s.service_id} className="py-2.5 flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.service_name}</p>
                        <p className="text-xs text-muted-foreground">{s.count} ventas · margen {s.margin.toFixed(1)}%</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">${s.profit.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award size={18} />Productos más rentables</CardTitle></CardHeader>
            <CardContent>
              {(profit.products ?? []).length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin ventas aún</p> :
                <div className="divide-y divide-border">
                  {profit.products.slice(0, 8).map((p: any, i: number) => (
                    <div key={p.product_id} className="py-2.5 flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.product_name}</p>
                        <p className="text-xs text-muted-foreground">{p.count} unidades · margen {p.margin.toFixed(1)}%</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">${p.profit.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>
        </div>

        {/* Employees & peak hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Crown size={18} />Empleados productivos</CardTitle></CardHeader>
            <CardContent>
              {employees.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p> :
                <div className="divide-y divide-border">
                  {employees.map((e, i) => (
                    <div key={e.employee_id} className="py-2.5 flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.employee_name}</p>
                        <p className="text-xs text-muted-foreground">{e.completed}/{e.appointments} citas · {e.completion_rate.toFixed(0)}% completadas</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">${e.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              }
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock size={18} />Horas más rentables</CardTitle></CardHeader>
            <CardContent>
              {(hours.by_hour ?? []).length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p> :
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hours.by_hour}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              }
              {(hours.by_day ?? []).length > 0 && (
                <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                  {hours.by_day.map((d: any) => (
                    <div key={d.day} className="text-xs">
                      <p className="text-muted-foreground">{d.label.slice(0, 3)}</p>
                      <p className="font-semibold">${d.revenue.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top spenders */}
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users size={18} />Clientes que más gastan</CardTitle></CardHeader>
          <CardContent>
            {spenders.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p> :
              <div className="divide-y divide-border">
                {spenders.slice(0, 10).map((c, i) => (
                  <div key={c.client_name} className="py-2.5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.client_name}</p>
                      <p className="text-xs text-muted-foreground">{c.appointments ?? 0} citas · {c.orders ?? 0} pedidos {c.phone ? `· ${c.phone}` : ""}</p>
                    </div>
                    <Badge variant="secondary" className="font-semibold">${Number(c.spent).toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
