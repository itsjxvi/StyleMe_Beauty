import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Download, Search, RefreshCw, User, Plus, Pencil, Trash2, LogIn, CheckCircle } from "lucide-react";
import { apiFetch, downloadCsv } from "@/lib/apiFetch";

const ACTION_ICONS: Record<string, JSX.Element> = {
  create: <Plus size={14} className="text-green-600" />,
  update: <Pencil size={14} className="text-blue-600" />,
  delete: <Trash2 size={14} className="text-red-600" />,
  login: <LogIn size={14} className="text-purple-600" />,
  register: <User size={14} className="text-purple-600" />,
  complete: <CheckCircle size={14} className="text-green-600" />,
};

const ACTION_LABELS: Record<string, string> = {
  create: "Creó", update: "Editó", delete: "Eliminó", login: "Inició sesión", register: "Se registró", complete: "Completó",
};

const ENTITY_LABELS: Record<string, string> = {
  appointment: "Cita", product: "Producto", service: "Servicio", category: "Categoría",
  brand: "Marca", provider: "Proveedor", order: "Pedido", promotion: "Promoción",
  user: "Usuario", invoice: "Factura", payment: "Pago", expense: "Gasto", review: "Reseña",
  auth: "Autenticación", stock: "Stock",
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (entityFilter !== "all") params.set("entity_type", entityFilter);
      const [r, s] = await Promise.all([
        apiFetch(`/activity-logs?${params}`),
        apiFetch("/activity-logs/summary"),
      ]);
      setLogs(r.items ?? []);
      setSummary(s);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [actionFilter, entityFilter]);

  const filtered = logs.filter(l =>
    !search ||
    (l.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (l.user_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2"><Activity size={24} />Registro de actividad</h1>
            <p className="text-sm text-muted-foreground">Quién creó, editó o eliminó cada cosa en el sistema.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv("/exports/activity-logs.csv", "actividad.csv")}><Download size={14} className="mr-1.5" />Exportar</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" />Actualizar</Button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total registros</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{summary.total}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Más activos</CardTitle></CardHeader>
              <CardContent>
                {summary.by_user.slice(0, 3).map((u: any) => (
                  <div key={u.name} className="flex justify-between text-sm py-0.5">
                    <span className="truncate">{u.name}</span><span className="text-muted-foreground">{u.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Por acción</CardTitle></CardHeader>
              <CardContent>
                {summary.by_action.slice(0, 4).map((a: any) => (
                  <div key={a.action} className="flex justify-between text-sm py-0.5">
                    <span className="capitalize">{ACTION_LABELS[a.action] ?? a.action}</span><span className="text-muted-foreground">{a.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg">Eventos recientes</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8 w-56" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda acción</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda entidad</SelectItem>
                  {Object.entries(ENTITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-12 text-muted-foreground">Cargando…</p> :
              filtered.length === 0 ? <p className="text-center py-12 text-muted-foreground">Sin actividad.</p> :
              <div className="divide-y divide-border">
                {filtered.map(l => (
                  <div key={l.id} className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      {ACTION_ICONS[l.action] ?? <Activity size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{l.user_name ?? "Sistema"}</span>
                        {l.user_role && <Badge variant="outline" className="text-xs">{l.user_role}</Badge>}
                        <span className="text-sm text-muted-foreground">{ACTION_LABELS[l.action] ?? l.action}</span>
                        {l.entity_type && <Badge variant="secondary" className="text-xs">{ENTITY_LABELS[l.entity_type] ?? l.entity_type}{l.entity_id ? ` #${l.entity_id}` : ""}</Badge>}
                      </div>
                      {l.description && <p className="text-sm text-muted-foreground mt-0.5">{l.description}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">{new Date(l.created_at).toLocaleString()}</p>
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
