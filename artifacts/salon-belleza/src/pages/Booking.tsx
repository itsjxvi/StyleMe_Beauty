import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListServices, useCreateAppointment } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Clock, ChevronLeft, CheckCircle, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";

export default function Booking() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"service" | "details" | "success">("service");
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [form, setForm] = useState({
    client_name: user?.full_name ?? "",
    client_phone: user?.phone ?? "",
    date: "",
    time: "",
    notes: "",
  });

  const { data: servicesData, isLoading } = useListServices();
  const services = servicesData?.items ?? [];
  const { toast } = useToast();

  const createMutation = useCreateAppointment({
    mutation: {
      onSuccess: () => setStep("success"),
      onError: (err: any) => {
        const msg = err?.body?.error || err?.message || "No se pudo crear la cita. Intenta de nuevo.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn size={28} className="text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-2">Inicia sesión para reservar</h1>
            <p className="text-sm text-muted-foreground mb-6">Necesitas una cuenta para crear citas y comprar productos. Es rápido y gratis.</p>
            <div className="flex gap-2">
              <Link href="/registro" className="flex-1"><Button variant="outline" className="w-full">Crear cuenta</Button></Link>
              <Link href="/login" className="flex-1"><Button className="w-full">Iniciar sesión</Button></Link>
            </div>
            <Link href="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">← Volver al inicio</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedSvc = services.find(s => s.id === selectedService);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const scheduled = new Date(`${form.date}T${form.time}:00`);
    createMutation.mutate({
      data: {
        service_id: selectedService,
        client_name: form.client_name,
        client_phone: form.client_phone || undefined,
        scheduled_at: scheduled.toISOString(),
        notes: form.notes || undefined,
        status: "pending",
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50/30">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft size={16} />
              Inicio
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Scissors size={18} className="text-primary" />
            <span className="font-serif font-bold text-foreground">Reservar Cita</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {step === "success" ? (
          <div className="text-center py-16">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
            <h2 className="font-serif text-3xl font-bold text-foreground mb-3">Cita Reservada</h2>
            <p className="text-muted-foreground mb-8">
              Tu cita ha sido agendada exitosamente. Te contactaremos para confirmar.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">Volver al inicio</Button>
              </Link>
              <Button onClick={() => { setStep("service"); setSelectedService(null); setForm({ client_name: "", client_phone: "", date: "", time: "", notes: "" }); }}>
                Nueva cita
              </Button>
            </div>
          </div>
        ) : step === "service" ? (
          <>
            <div className="mb-8">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Selecciona un Servicio</h2>
              <p className="text-muted-foreground">Elige el servicio que deseas reservar</p>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {services.map(service => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all border-2 ${selectedService === service.id ? "border-primary shadow-md shadow-primary/10" : "border-border/50 hover:border-primary/40 hover:shadow-sm"}`}
                    onClick={() => setSelectedService(service.id!)}
                  >
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedService === service.id ? "bg-primary" : "bg-primary/10"}`}>
                        <Scissors size={18} className={selectedService === service.id ? "text-white" : "text-primary"} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Clock size={11} />
                          <span>{service.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">${Number(service.price).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-8">
              <Button
                size="lg"
                className="w-full"
                disabled={!selectedService}
                onClick={() => setStep("details")}
              >
                Continuar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <button onClick={() => setStep("service")} className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm">
                <ChevronLeft size={14} />
                Cambiar servicio
              </button>
              <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Datos de la Cita</h2>
              <p className="text-muted-foreground">
                Servicio seleccionado: <span className="font-medium text-foreground">{selectedSvc?.name}</span>
              </p>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Información del cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo *</Label>
                      <Input
                        id="name"
                        value={form.client_name}
                        onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.client_phone}
                        onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                        placeholder="8888-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Fecha *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Hora *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={form.time}
                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas adicionales</Label>
                    <textarea
                      id="notes"
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Alguna indicación especial..."
                      className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Reservando..." : "Confirmar Reserva"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
