import { useState, useMemo } from "react";
import { useListAppointments, useUpdateAppointment, useListServices } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 border-yellow-300 text-yellow-800",
  confirmed: "bg-blue-100 border-blue-300 text-blue-800",
  completed: "bg-green-100 border-green-300 text-green-800",
  cancelled: "bg-red-100 border-red-300 text-red-800",
};

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function Calendar() {
  const [view, setView] = useState<"day" | "week">("week");
  const [cursor, setCursor] = useState(new Date());
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data, refetch } = useListAppointments();
  const { data: servicesData } = useListServices();
  const services = servicesData?.items ?? [];
  const appointments = data?.items ?? [];

  const updateMutation = useUpdateAppointment({
    mutation: {
      onSuccess: () => { refetch(); toast({ title: "Cita reprogramada" }); },
      onError: () => toast({ title: "Error al mover cita", variant: "destructive" }),
    },
  });

  const days = useMemo(() => {
    if (view === "day") return [cursor];
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view, cursor]);

  const apptsByDateHour = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const a of appointments) {
      const hour = parseInt((a.appointment_time || "00:00").split(":")[0]);
      const key = `${a.appointment_date}-${hour}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [appointments]);

  const slotBookedHours = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    for (const a of appointments) {
      if (a.status === "cancelled") continue;
      if (!map[a.appointment_date]) map[a.appointment_date] = new Set();
      const hour = parseInt((a.appointment_time || "00:00").split(":")[0]);
      map[a.appointment_date].add(hour);
    }
    return map;
  }, [appointments]);

  const navigate = (delta: number) => {
    const d = new Date(cursor);
    d.setDate(d.getDate() + (view === "day" ? delta : delta * 7));
    setCursor(d);
  };

  const handleDrop = (date: string, hour: number) => {
    if (!draggingId) return;
    const apt = appointments.find((a: any) => a.id === draggingId);
    if (!apt) return;
    const time = `${String(hour).padStart(2, "0")}:00`;
    updateMutation.mutate({
      id: draggingId,
      data: { appointment_date: date, appointment_time: time },
    });
    setDraggingId(null);
  };

  const monthLabel = cursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Calendario de Citas</h1>
            <p className="text-sm text-muted-foreground capitalize">{monthLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setView("day")}
                className={`px-3 py-1.5 text-sm rounded-md transition ${view === "day" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >Día</button>
              <button
                onClick={() => setView("week")}
                className={`px-3 py-1.5 text-sm rounded-md transition ${view === "week" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >Semana</button>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ChevronLeft size={16} /></Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Hoy</Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}><ChevronRight size={16} /></Button>
          </div>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="grid" style={{ gridTemplateColumns: `60px repeat(${days.length}, minmax(140px, 1fr))` }}>
                <div className="border-b border-r border-border bg-muted/40 p-2"></div>
                {days.map(d => {
                  const isToday = formatDate(d) === formatDate(new Date());
                  return (
                    <div key={formatDate(d)} className={`border-b border-r border-border p-2 text-center ${isToday ? "bg-primary/5" : "bg-muted/40"}`}>
                      <p className="text-xs text-muted-foreground capitalize">{d.toLocaleDateString("es-ES", { weekday: "short" })}</p>
                      <p className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</p>
                    </div>
                  );
                })}

                {HOURS.map(hour => (
                  <div key={hour} className="contents">
                    <div className="border-b border-r border-border p-2 text-xs text-muted-foreground text-right pr-3">
                      {String(hour).padStart(2, "0")}:00
                    </div>
                    {days.map(d => {
                      const dateStr = formatDate(d);
                      const key = `${dateStr}-${hour}`;
                      const slotAppts = apptsByDateHour[key] || [];
                      const isBooked = slotBookedHours[dateStr]?.has(hour);
                      return (
                        <div
                          key={key}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(dateStr, hour)}
                          className={`border-b border-r border-border min-h-[60px] p-1 transition-colors ${isBooked ? "" : "hover:bg-green-50/50"}`}
                        >
                          {slotAppts.map((a: any) => {
                            const svc = services.find((s: any) => s.id === a.service_id);
                            return (
                              <div
                                key={a.id}
                                draggable
                                onDragStart={() => setDraggingId(a.id)}
                                className={`text-xs p-1.5 mb-1 rounded border cursor-move ${STATUS_COLORS[a.status]}`}
                                title={`${a.client_name} - ${svc?.name ?? "Sin servicio"}`}
                              >
                                <div className="font-semibold truncate">{a.client_name}</div>
                                <div className="truncate opacity-80">{svc?.name ?? "Sin servicio"}</div>
                              </div>
                            );
                          })}
                          {!slotAppts.length && (
                            <div className="text-[10px] text-green-600/40 text-center pt-3">Libre</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300" />Pendiente</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />Confirmada</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-200 border border-green-300" />Completada</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-200 border border-red-300" />Cancelada</div>
          <div className="ml-auto flex items-center gap-1.5"><Clock size={12} />Arrastra una cita para reprogramarla</div>
        </div>
      </div>
    </AdminLayout>
  );
}
