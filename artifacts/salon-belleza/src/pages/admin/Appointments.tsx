import { useState } from "react";
import { useListAppointments, useUpdateAppointment, useDeleteAppointment, useCreateAppointment, useListServices } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, Clock, Phone, User, ChevronDown, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const EMPTY_FORM = {
  client_name: "",
  client_phone: "",
  service_id: 0,
  date: "",
  time: "",
  notes: "",
  status: "pending" as string,
};

export default function Appointments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListAppointments({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined });
  const { data: servicesData } = useListServices();
  const services = servicesData?.items ?? [];
  const appointments = data?.items ?? [];

  const createMutation = useCreateAppointment({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY_FORM); toast({ title: "Cita creada exitosamente" }); }, onError: () => toast({ title: "Error al crear cita", variant: "destructive" }) } });
  const updateMutation = useUpdateAppointment({ mutation: { onSuccess: () => { refetch(); setShowEdit(null); toast({ title: "Cita actualizada" }); }, onError: () => toast({ title: "Error al actualizar", variant: "destructive" }) } });
  const deleteMutation = useDeleteAppointment({ mutation: { onSuccess: () => { refetch(); toast({ title: "Cita eliminada" }); }, onError: () => toast({ title: "Error al eliminar", variant: "destructive" }) } });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const dt = new Date(`${form.date}T${form.time}:00`);
    createMutation.mutate({ data: { service_id: form.service_id, client_name: form.client_name, client_phone: form.client_phone || undefined, scheduled_at: dt.toISOString(), notes: form.notes || undefined, status: form.status } });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const dt = new Date(`${form.date}T${form.time}:00`);
    updateMutation.mutate({ id: showEdit.id, data: { service_id: form.service_id, client_name: form.client_name, client_phone: form.client_phone || undefined, scheduled_at: dt.toISOString(), notes: form.notes || undefined, status: form.status } });
  };

  const openEdit = (apt: any) => {
    const d = new Date(apt.scheduled_at);
    setForm({
      client_name: apt.client_name,
      client_phone: apt.client_phone || "",
      service_id: apt.service_id,
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().slice(0, 5),
      notes: apt.notes || "",
      status: apt.status,
    });
    setShowEdit(apt);
  };

  const AppointmentForm = ({ onSubmit, loading }: { onSubmit: (e: React.FormEvent) => void; loading: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Nombre del cliente *</Label>
          <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Servicio *</Label>
        <Select value={String(form.service_id)} onValueChange={v => setForm(f => ({ ...f, service_id: Number(v) }))}>
          <SelectTrigger><SelectValue placeholder="Seleccionar servicio" /></SelectTrigger>
          <SelectContent>
            {services.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Fecha *</Label>
          <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Hora *</Label>
          <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Estado</Label>
        <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Notas</Label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full min-h-[70px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Citas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} citas en total</p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }} className="gap-2">
            <Plus size={16} />
            Nueva Cita
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-border/60">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p>No hay citas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cliente</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Servicio</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha y hora</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {appointments.map((apt: any) => {
                      const d = new Date(apt.scheduled_at);
                      return (
                        <tr key={apt.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-muted-foreground" />
                              <span className="font-medium">{apt.client_name}</span>
                            </div>
                            {apt.client_phone && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                <Phone size={10} />
                                {apt.client_phone}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {services.find(s => s.id === apt.service_id)?.name ?? "-"}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-muted-foreground" />
                              <span>{d.toLocaleDateString("es-CR")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                              <Clock size={11} />
                              {d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[apt.status] || "bg-muted text-muted-foreground"}`}>
                              {STATUS_LABELS[apt.status] || apt.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(apt)}>Editar</Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => { if (confirm("¿Eliminar esta cita?")) deleteMutation.mutate({ id: apt.id }); }}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva Cita</DialogTitle></DialogHeader>
          <AppointmentForm onSubmit={handleCreate} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Cita</DialogTitle></DialogHeader>
          {showEdit && <AppointmentForm onSubmit={handleUpdate} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
