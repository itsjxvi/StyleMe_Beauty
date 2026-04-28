import { useState } from "react";
import { useGetIncomeReport, useGetTopServices, useGetFrequentClients } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, Package } from "lucide-react";

export default function Reports() {
  const [period, setPeriod] = useState<"day" | "month">("day");
  const { data: income } = useGetIncomeReport({ period });
  const { data: topServices } = useGetTopServices();
  const { data: frequent } = useGetFrequentClients();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground">Analítica del negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Ingresos totales</p>
                <TrendingUp size={18} className="text-green-600" />
              </div>
              <p className="text-3xl font-bold mt-2">${(income?.total ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Servicios populares</p>
                <Package size={18} className="text-primary" />
              </div>
              <p className="text-3xl font-bold mt-2">{topServices?.items?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Clientes frecuentes</p>
                <Users size={18} className="text-blue-600" />
              </div>
              <p className="text-3xl font-bold mt-2">{frequent?.items?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Ingresos por {period === "day" ? "día" : "mes"}</CardTitle>
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setPeriod("day")}
                className={`px-3 py-1 text-xs rounded-md ${period === "day" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >Día</button>
              <button
                onClick={() => setPeriod("month")}
                className={`px-3 py-1 text-xs rounded-md ${period === "month" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >Mes</button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Servicios más vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {(topServices?.items?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topServices?.items ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="service_name" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clientes frecuentes</CardTitle>
            </CardHeader>
            <CardContent>
              {(frequent?.items?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              ) : (
                <div className="divide-y divide-border">
                  {frequent?.items?.map((c: any, i: number) => (
                    <div key={c.client_name} className="py-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.client_name}</p>
                        <p className="text-xs text-muted-foreground">{c.appointment_count} citas</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">${Number(c.total_spent).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
