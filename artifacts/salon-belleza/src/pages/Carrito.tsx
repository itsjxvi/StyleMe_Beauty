import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Scissors, ShoppingCart, Trash2, Plus, Minus, Truck, ArrowLeft, CheckCircle2, Tag } from "lucide-react";
import { useCart } from "@/contexts/cart";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";

const DELIVERY_FEE = 3.5;

export default function Carrito() {
  const { items, setQty, remove, clear, subtotal, count } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    customer_name: user?.full_name ?? "",
    customer_phone: user?.phone ?? "",
    customer_email: user?.email ?? "",
    is_delivery: false,
    delivery_address: "",
    payment_method: "cash" as "cash" | "card" | "transfer" | "delivery_cash",
    notes: "",
    promotion_code: "",
  });
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const deliveryCost = form.is_delivery ? DELIVERY_FEE : 0;
  const total = Math.max(0, subtotal - discount) + deliveryCost;

  const applyPromo = async () => {
    if (!form.promotion_code) return;
    try {
      const r = await apiFetch("/promotions/validate", {
        method: "POST",
        body: JSON.stringify({ code: form.promotion_code, subtotal, applies: "products" }),
      });
      if (r.valid) {
        setDiscount(r.discount);
        toast({ title: "Promoción aplicada", description: `Descuento $${r.discount.toFixed(2)}` });
      } else {
        setDiscount(0);
        toast({ title: r.error || "Código inválido", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const checkout = async () => {
    if (!user) {
      toast({ title: "Debes iniciar sesión para comprar", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (items.length === 0) return;
    if (form.is_delivery && !form.delivery_address.trim()) {
      toast({ title: "Ingresa la dirección de entrega", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const order = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_phone: form.customer_phone || null,
          customer_email: form.customer_email || null,
          is_delivery: form.is_delivery,
          delivery_address: form.is_delivery ? form.delivery_address : null,
          payment_method: form.payment_method,
          promotion_code: form.promotion_code || null,
          notes: form.notes || null,
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        }),
      });
      setSuccess(order);
      clear();
      toast({ title: "¡Pedido creado!", description: `Pedido #${order.id} - Total $${order.total.toFixed(2)}` });
    } catch (e: any) {
      toast({ title: "Error al crear pedido", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h1 className="font-serif text-2xl font-bold mb-2">¡Pedido confirmado!</h1>
            <p className="text-sm text-muted-foreground mb-1">Pedido <span className="font-semibold text-foreground">#{success.id}</span></p>
            <p className="text-2xl font-bold text-primary my-3">${Number(success.total).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mb-6">
              {success.is_delivery ? "Te contactaremos para coordinar la entrega." : "Pasa por el local a recoger tu pedido."}
            </p>
            <div className="flex gap-2">
              <Link href="/tienda" className="flex-1"><Button variant="outline" className="w-full">Seguir comprando</Button></Link>
              <Link href="/" className="flex-1"><Button className="w-full">Inicio</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Scissors size={16} className="text-white" />
              </div>
              <span className="font-serif font-bold text-xl">Salón de Belleza</span>
            </div>
          </Link>
          <Link href="/tienda"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft size={14} />Seguir comprando</Button></Link>
        </div>
      </header>

      <div className="pt-24 pb-12 max-w-6xl mx-auto px-6">
        <h1 className="font-serif text-3xl font-bold mb-6 flex items-center gap-2">
          <ShoppingCart size={28} /> Tu carrito
          {count > 0 && <span className="text-sm font-normal text-muted-foreground">({count} {count === 1 ? "producto" : "productos"})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
            <p className="mb-5">Tu carrito está vacío.</p>
            <Link href="/tienda"><Button>Ir a la tienda</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map(it => (
                <Card key={it.product_id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{it.name}</h3>
                      <p className="text-sm text-muted-foreground">${it.price.toFixed(2)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(it.product_id, it.quantity - 1)}><Minus size={14} /></Button>
                      <span className="w-8 text-center font-semibold">{it.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(it.product_id, it.quantity + 1)}><Plus size={14} /></Button>
                    </div>
                    <p className="font-bold w-20 text-right">${(it.price * it.quantity).toFixed(2)}</p>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => remove(it.product_id)}><Trash2 size={14} /></Button>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader><CardTitle className="text-lg">Datos del cliente</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>Nombre</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
                    <div><Label>Teléfono</Label><Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} /></div>
                    <div className="md:col-span-2"><Label>Email</Label><Input value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Entrega</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Checkbox id="del" checked={form.is_delivery} onCheckedChange={(v) => setForm(f => ({ ...f, is_delivery: !!v }))} className="mt-1" />
                    <Label htmlFor="del" className="cursor-pointer">
                      <div className="flex items-center gap-2"><Truck size={16} /> Envío a domicilio (+${DELIVERY_FEE.toFixed(2)})</div>
                      <p className="text-xs text-muted-foreground font-normal mt-1">Quito y valles. 1-2 días hábiles.</p>
                    </Label>
                  </div>
                  {form.is_delivery && (
                    <div>
                      <Label>Dirección de entrega</Label>
                      <Textarea value={form.delivery_address} onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))} placeholder="Calle, número, sector, referencia" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Pago</CardTitle></CardHeader>
                <CardContent>
                  <RadioGroup value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v as any }))}>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2.5 rounded-md border hover-elevate cursor-pointer">
                        <RadioGroupItem value="cash" id="p1" /><span>Efectivo en local</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-md border hover-elevate cursor-pointer">
                        <RadioGroupItem value="card" id="p2" /><span>Tarjeta de crédito/débito</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-md border hover-elevate cursor-pointer">
                        <RadioGroupItem value="transfer" id="p3" /><span>Transferencia bancaria</span>
                      </label>
                      {form.is_delivery && (
                        <label className="flex items-center gap-2 p-2.5 rounded-md border hover-elevate cursor-pointer">
                          <RadioGroupItem value="delivery_cash" id="p4" /><span>Pago contra entrega</span>
                        </label>
                      )}
                    </div>
                  </RadioGroup>
                  <Textarea className="mt-3" placeholder="Notas adicionales (opcional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader><CardTitle className="text-lg">Resumen</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Descuento</span><span>−${discount.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-sm"><span>Envío</span><span className="font-semibold">{form.is_delivery ? `$${DELIVERY_FEE.toFixed(2)}` : "—"}</span></div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>

                  <div className="border-t pt-3">
                    <Label className="text-xs">Código promocional</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={form.promotion_code} onChange={e => setForm(f => ({ ...f, promotion_code: e.target.value }))} placeholder="BIENVENIDA10" />
                      <Button variant="outline" size="sm" onClick={applyPromo}><Tag size={14} /></Button>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={checkout} disabled={submitting || !user}>
                    {submitting ? "Procesando..." : user ? "Confirmar pedido" : "Inicia sesión para comprar"}
                  </Button>
                  {!user && (
                    <p className="text-xs text-center text-muted-foreground">
                      <Link href="/login" className="text-primary underline">Iniciar sesión</Link> o <Link href="/registro" className="text-primary underline">registrarse</Link>
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
