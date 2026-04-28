import { useState } from "react";
import { useListStock, useCreateStockMovement, useListProducts } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Layers, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EMPTY = { product_id: "", movement_type: "in", quantity: 1, notes: "" };

export default function Stock() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListStock();
  const { data: productsData } = useListProducts();
  const items = data?.items ?? [];
  const products = productsData?.items ?? [];

  const createMutation = useCreateStockMovement({
    mutation: {
      onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY); toast({ title: "Movimiento registrado" }); },
      onError: () => toast({ title: "Error", variant: "destructive" })
    }
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Control de Stock</h1>
            <p className="text-sm text-muted-foreground">Inventario actual de productos</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowCreate(true); }} className="gap-2">
            <Plus size={16} />Registrar Movimiento
          </Button>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Layers size={40} className="mx-auto mb-3 opacity-30" />
                <p>Sin movimientos de stock</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Producto</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cantidad</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Notas</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item: any) => {
                      const product = products.find((p: any) => p.id === item.product_id);
                      return (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 font-medium">{product?.name ?? `Producto #${item.product_id}`}</td>
                          <td className="px-5 py-3.5">
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${item.movement_type === "in" ? "text-green-600" : "text-red-600"}`}>
                              {item.movement_type === "in" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                              {item.movement_type === "in" ? "Entrada" : "Salida"}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`font-semibold ${item.movement_type === "in" ? "text-green-600" : "text-red-600"}`}>
                              {item.movement_type === "in" ? "+" : "-"}{item.quantity}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">{item.notes || "-"}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString("es-CR")}
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Movimiento de Stock</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ data: { product_id: Number(form.product_id), movement_type: form.movement_type, quantity: form.quantity, notes: form.notes || undefined } }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Producto *</Label>
              <Select value={String(form.product_id)} onValueChange={v => setForm((f: any) => ({ ...f, product_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.movement_type} onValueChange={v => setForm((f: any) => ({ ...f, movement_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Salida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cantidad *</Label>
                <Input type="number" min="1" value={form.quantity} onChange={e => setForm((f: any) => ({ ...f, quantity: Number(e.target.value) }))} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Input value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} placeholder="Motivo del movimiento..." />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Guardando..." : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
