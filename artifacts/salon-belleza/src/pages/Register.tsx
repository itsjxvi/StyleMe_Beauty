import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateUser, useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setUser(data.user as any);
        setLocation("/");
      },
    },
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cuenta creada", description: "¡Bienvenido a StyleMe Beauty!" });
        loginMutation.mutate({ data: { email, password } });
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err?.response?.data?.error || "No se pudo crear la cuenta",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      data: {
        full_name: fullName,
        email,
        password,
        role: "client",
        phone: phone || null,
      },
    });
  };

  const isPending = createMutation.isPending || loginMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
            <Scissors size={28} className="text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">StyleMe Beauty</h1>
          <p className="text-muted-foreground mt-1">Crea tu cuenta</p>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Registro</CardTitle>
            <CardDescription>Completa tus datos para crear una cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  data-testid="input-fullname"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  data-testid="input-email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+000 0000-0000"
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  data-testid="input-password"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  data-testid="input-confirm"
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                data-testid="button-register"
              >
                {isPending ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-primary hover:underline">Iniciar sesión</a>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          <a href="/" className="text-primary hover:underline">Volver al inicio</a>
        </p>
      </div>
    </div>
  );
}
