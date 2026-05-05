import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scissors, User, Lock, Crown, ChevronLeft, Check } from "lucide-react";

const TIERS = {
  basic: {
    label: "Básica",
    color: "from-slate-400 to-slate-600",
    badge: "bg-slate-100 text-slate-700",
    icon: "⭐",
    price: "Gratis",
    benefits: [
      "Reservas online",
      "Historial de citas",
      "Acceso a la tienda",
      "Reseñas y valoraciones",
    ],
  },
  premium: {
    label: "Premium",
    color: "from-violet-500 to-purple-700",
    badge: "bg-violet-100 text-violet-700",
    icon: "💎",
    price: "$9.99/mes",
    benefits: [
      "Todo lo de Básica",
      "10% descuento en servicios",
      "Reservas prioritarias",
      "Soporte rápido por chat",
      "Promociones exclusivas",
    ],
  },
  vip: {
    label: "VIP",
    color: "from-amber-400 to-orange-600",
    badge: "bg-amber-100 text-amber-700",
    icon: "👑",
    price: "$19.99/mes",
    benefits: [
      "Todo lo de Premium",
      "20% descuento en servicios",
      "Cancelación gratuita",
      "Regalo mensual de bienvenida",
      "Acceso anticipado a novedades",
      "Estilista personal asignado",
    ],
  },
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
  });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/memberships/my").then(setMembership).catch(() => {});
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({ full_name: profileForm.full_name, phone: profileForm.phone || null }),
      });
      setUser({ ...user!, ...updated });
      toast({ title: "Perfil actualizado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    try {
      await apiFetch("/profile/change-password", {
        method: "POST",
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      toast({ title: "Contraseña actualizada" });
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPw(false);
    }
  };

  const upgradeMembership = async (tier: string) => {
    setUpgradingTier(tier);
    try {
      const result = await apiFetch("/memberships/upgrade", {
        method: "PUT",
        body: JSON.stringify({ tier }),
      });
      setMembership(result);
      toast({ title: `¡Membresía ${TIERS[tier as keyof typeof TIERS].label} activada!`, description: "Tus beneficios están activos ahora." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUpgradingTier(null);
    }
  };

  const currentTier = membership?.tier ?? "basic";
  const tierInfo = TIERS[currentTier as keyof typeof TIERS];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="p-8 text-center">
            <User size={40} className="mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Inicia sesión para ver tu perfil</p>
            <Link href="/login"><Button className="w-full">Iniciar sesión</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ChevronLeft size={16} />
                Inicio
              </Button>
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Scissors size={13} className="text-white" />
              </div>
              <span className="font-serif font-bold text-lg">StyleMe Beauty</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${tierInfo.badge}`}>
            {tierInfo.icon} {tierInfo.label}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tierInfo.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">{user.full_name}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${tierInfo.badge}`}>
              {tierInfo.icon} Membresía {tierInfo.label}
            </span>
          </div>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="perfil" className="gap-2"><User size={14} />Perfil</TabsTrigger>
            <TabsTrigger value="seguridad" className="gap-2"><Lock size={14} />Seguridad</TabsTrigger>
            <TabsTrigger value="membresia" className="gap-2"><Crown size={14} />Membresía</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <Card>
              <CardHeader><CardTitle className="text-base">Información personal</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={saveProfile} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <Label>Nombre completo</Label>
                    <Input
                      value={profileForm.full_name}
                      onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Correo electrónico</Label>
                    <Input value={user.email} disabled className="opacity-60" />
                    <p className="text-xs text-muted-foreground">El correo no se puede cambiar</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Teléfono</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+593 99 000 0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <Input value={{ admin: "Administrador", employee: "Empleado", client: "Cliente" }[user.role] ?? user.role} disabled className="opacity-60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Miembro desde</Label>
                    <Input value={new Date(user.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })} disabled className="opacity-60" />
                  </div>
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguridad">
            <Card>
              <CardHeader><CardTitle className="text-base">Cambiar contraseña</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={changePassword} className="space-y-4 max-w-md">
                  <div className="space-y-1.5">
                    <Label>Contraseña actual</Label>
                    <Input
                      type="password"
                      value={pwForm.current_password}
                      onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nueva contraseña</Label>
                    <Input
                      type="password"
                      value={pwForm.new_password}
                      onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirmar contraseña</Label>
                    <Input
                      type="password"
                      value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={savingPw}>
                    {savingPw ? "Cambiando..." : "Cambiar contraseña"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membresia">
            <div className="space-y-4">
              <div className={`rounded-2xl bg-gradient-to-r ${tierInfo.color} p-6 text-white`}>
                <div className="text-4xl mb-2">{tierInfo.icon}</div>
                <p className="font-bold text-xl">Membresía {tierInfo.label}</p>
                <p className="text-white/80 text-sm mt-1">{tierInfo.price === "Gratis" ? "Plan gratuito" : tierInfo.price}</p>
                {membership?.expires_at && (
                  <p className="text-white/70 text-xs mt-2">
                    Válida hasta: {new Date(membership.expires_at).toLocaleDateString("es-ES")}
                  </p>
                )}
                <div className="mt-4 space-y-1.5">
                  {tierInfo.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/90">
                      <Check size={14} className="shrink-0" />
                      {b}
                    </div>
                  ))}
                </div>
              </div>

              <p className="font-semibold text-sm text-muted-foreground">Cambiar plan</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(Object.entries(TIERS) as [string, typeof TIERS.basic][]).map(([key, info]) => {
                  const isActive = currentTier === key;
                  return (
                    <Card key={key} className={`relative overflow-hidden border-2 transition-all ${isActive ? "border-primary" : "border-border hover:border-primary/50"}`}>
                      {isActive && (
                        <div className="absolute top-2 right-2">
                          <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Activo</span>
                        </div>
                      )}
                      <CardContent className="p-5">
                        <div className="text-2xl mb-2">{info.icon}</div>
                        <p className="font-bold">{info.label}</p>
                        <p className="text-primary font-semibold text-sm">{info.price}</p>
                        <ul className="mt-3 space-y-1.5">
                          {info.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <Check size={12} className="shrink-0 mt-0.5 text-green-500" />
                              {b}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full mt-4"
                          variant={isActive ? "outline" : "default"}
                          disabled={isActive || upgradingTier === key}
                          onClick={() => upgradeMembership(key)}
                          size="sm"
                        >
                          {isActive ? "Plan actual" : upgradingTier === key ? "Activando..." : key === "basic" ? "Cambiar a Básica" : `Activar ${info.label}`}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
