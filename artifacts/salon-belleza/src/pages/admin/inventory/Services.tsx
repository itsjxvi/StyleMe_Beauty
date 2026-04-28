import { useState } from "react";
import { useListServices, useCreateService, useUpdateService, useDeleteService, useListServiceProducts, useCreateServiceProduct, useDeleteServiceProduct, useListProducts } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Scissors, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EMPTY = { name: "", description: "", price: "", duration_minutes: 60, is_active: true };

export default function Services() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [showProducts, setShowProducts] = useState<any>(null);
  const [productLink, setProductLink] = useState({ product_id: "", quantity: "1" });
  const [form, setForm] = useState<any>(EMPTY);
  const { toast } = useToast();
  const { data: spData, refetch: refetchSP } = useListServiceProducts(showProducts ? { service_id: showProducts.id } : undefined);
  const { data: productsData } = useListProducts();
  const products = productsData?.items ?? [];
  const createSP = useCreateServiceProduct({ mutation: { onSuccess: () => { refetchSP(); setProductLink({ product_id: "", quantity: "1" }); toast({ title: "Producto vinculado" }); } } });
  const deleteSP = useDeleteServiceProduct({ mutation: { onSuccess: () => { refetchSP(); toast({ title: "Vínculo eliminado" }); } } });

  const { data, isLoading, refetch } = useListServices({ search: search || undefined });
  const items = data?.items ?? [];

  const createMutation = useCreateService({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY); toast({ title: "Servicio creado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const updateMutation = useUpdateService({ mutation: { onSuccess: () => { refetch(); setShowEdit(null); toast({ title: "Servicio actualizado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const deleteMutation = useDeleteService({ mutation: { onSuccess: () => { refetch(); toast({ title: "Servicio eliminado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });

  const ItemForm = ({ onSubmit, loading }: any) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nombre *</Label>
        <Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="w-full min-h-[70px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Precio ($) *</Label>
          <Input type="number" step="0.01" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Duración (min) *</Label>
          <Input type="number" value={form.duration_minutes} onChange={e => setForm((f: any) => ({ ...f, duration_minutes: Number(e.target.value) }))} required />
        </div>
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
            <h1 className="font-serif text-2xl font-bold">Servicios</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} servicios</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowCreate(true); }} className="gap-2">
            <Plus size={16} />Nuevo Servicio
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar servicios..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />) :
            items.map((item: any) => (
              <Card key={item.id} className="border-border/60 hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Scissors size={18} className="text-primary" />
                    </div>
                    <p className="font-semibold text-primary text-lg">${Number(item.price).toLocaleString()}</p>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                  {item.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>}
                  <p className="text-xs text-muted-foreground mb-4">{item.duration_minutes} minutos</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setForm({ name: item.name, description: item.description || "", price: item.price, duration_minutes: item.duration_minutes, is_active: item.is_active }); setShowEdit(item); }}>Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowProducts(item)} title="Productos usados"><Package size={14} /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("¿Eliminar servicio?")) deleteMutation.mutate({ id: item.id }); }}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Servicio</DialogTitle></DialogHeader>
          <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ data: { name: form.name, description: form.description || undefined, price: String(form.price), duration_minutes: form.duration_minutes, is_active: form.is_active } }); }} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Servicio</DialogTitle></DialogHeader>
          {showEdit && <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate({ id: showEdit.id, data: { name: form.name, description: form.description || undefined, price: String(form.price), duration_minutes: form.duration_minutes, is_active: form.is_active } }); }} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!showProducts} onOpenChange={() => setShowProducts(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Productos usados en "{showProducts?.name}"</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">Estos productos se descontarán automáticamente del inventario al completar una cita.</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(spData?.items ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aún no hay productos vinculados</p>
            ) : (
              (spData?.items ?? []).map((sp: any) => (
                <div key={sp.id} className="flex items-center justify-between bg-accent/30 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{sp.product_name}</p>
                    <p className="text-xs text-muted-foreground">Cantidad usada: {sp.quantity}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteSP.mutate({ id: sp.id })}>
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-semibold">Vincular nuevo producto</p>
            <div className="grid grid-cols-3 gap-2">
              <select className="col-span-2 h-9 px-2 text-sm border border-input rounded-md bg-background" value={productLink.product_id} onChange={e => setProductLink(p => ({ ...p, product_id: e.target.value }))}>
                <option value="">Selecciona producto</option>
                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Input type="number" step="0.01" min="0.01" placeholder="Cantidad" value={productLink.quantity} onChange={e => setProductLink(p => ({ ...p, quantity: e.target.value }))} />
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={!productLink.product_id || !productLink.quantity}
              onClick={() => createSP.mutate({ data: { service_id: showProducts.id, product_id: Number(productLink.product_id), quantity: productLink.quantity } })}
            >Vincular producto</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
