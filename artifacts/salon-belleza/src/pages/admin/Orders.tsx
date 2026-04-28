import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag, Truck, Download, Eye, RefreshCw } from "lucide-react";
import { apiFetch, downloadCsv } from "@/lib/apiFetch";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  pending: { label: "Pendiente", variant: "outline" },
  paid: { label: "Pagado", variant: "default" },
  preparing: { label: "Preparando", variant: "secondary" },
  shipped: { label: "Enviado", variant: "secondary" },
  delivered: { label: "Entregado", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export default function Orders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch("/orders");
      setOrders(r.items ?? []);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast({ title: "Pedido actualizado" });
      load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const total = filtered.reduce((s, o) => s + Number(o.total), 0);
  const pending = orders.filter(o => o.status === "pending" || o.status === "preparing").length;
  const delivery = orders.filter(o => o.is_delivery).length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Ventas / Pedidos</h1>
            <p className="text-sm text-muted-foreground">Pedidos de la tienda online</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCsv("/exports/orders.csv", "ventas.csv")}><Download size={14} className="mr-1.5" />Exportar CSV</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" />Actualizar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total pedidos</p><p className="text-2xl font-bold">{orders.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Por procesar</p><p className="text-2xl font-bold text-orange-500">{pending}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">A domicilio</p><p className="text-2xl font-bold text-blue-600">{delivery}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total ventas</p><p className="text-2xl font-bold text-primary">${total.toFixed(2)}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pedidos</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-12 text-muted-foreground">Cargando…</p> :
              filtered.length === 0 ? <p className="text-center py-12 text-muted-foreground">Sin pedidos.</p> :
              <div className="divide-y divide-border">
                {filtered.map(o => (
                  <div key={o.id} className="py-3 flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ShoppingBag size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">#{o.id}</span>
                        <span>{o.customer_name}</span>
                        {o.is_delivery && <Badge variant="outline" className="gap-1"><Truck size={11} />Domicilio</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.items?.length ?? 0} productos · {o.payment_method}</p>
                    </div>
                    <p className="font-bold text-primary">${Number(o.total).toFixed(2)}</p>
                    <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setView(o)}><Eye size={14} /></Button>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Pedido #{view?.id}</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Cliente: </span><span className="font-medium">{view.customer_name}</span></div>
              {view.customer_phone && <div><span className="text-muted-foreground">Teléfono: </span>{view.customer_phone}</div>}
              {view.customer_email && <div><span className="text-muted-foreground">Email: </span>{view.customer_email}</div>}
              {view.is_delivery && (
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Truck size={12} />A domicilio</p>
                  <p className="text-xs">{view.delivery_address}</p>
                </div>
              )}
              <div className="border-t pt-2">
                <p className="font-semibold mb-2">Productos</p>
                {view.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between py-1">
                    <span>{it.product_name} <span className="text-muted-foreground">x{it.quantity}</span></span>
                    <span className="font-medium">${Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>${Number(view.subtotal).toFixed(2)}</span></div>
                {Number(view.discount) > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>−${Number(view.discount).toFixed(2)}</span></div>}
                {Number(view.delivery_cost) > 0 && <div className="flex justify-between"><span>Envío</span><span>${Number(view.delivery_cost).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span className="text-primary">${Number(view.total).toFixed(2)}</span></div>
              </div>
              {view.notes && <div className="border-t pt-2 text-xs text-muted-foreground">Notas: {view.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
