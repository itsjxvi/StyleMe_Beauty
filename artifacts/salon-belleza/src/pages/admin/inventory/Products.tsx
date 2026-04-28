import { useState } from "react";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useListCategories, useListBrands } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Package, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EMPTY = { name: "", description: "", price: "", cost: "", stock: "0", category_id: "none", brand_id: "none" };

export default function Products() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListProducts();
  const allItems = data?.items ?? [];
  const items = search
    ? allItems.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()))
    : allItems;
  const { data: cats } = useListCategories();
  const { data: brands } = useListBrands();

  const createMutation = useCreateProduct({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY); toast({ title: "Producto creado" }); }, onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }) } });
  const updateMutation = useUpdateProduct({ mutation: { onSuccess: () => { refetch(); setShowEdit(null); toast({ title: "Producto actualizado" }); }, onError: (e: any) => toast({ title: "Error", description: e?.message, variant: "destructive" }) } });
  const deleteMutation = useDeleteProduct({ mutation: { onSuccess: () => { refetch(); toast({ title: "Producto eliminado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });

  const buildPayload = () => ({
    name: form.name,
    description: form.description || null,
    price: Number(form.price),
    cost: form.cost ? Number(form.cost) : null,
    stock: Number(form.stock || 0),
    category_id: form.category_id && form.category_id !== "none" ? Number(form.category_id) : null,
    brand_id: form.brand_id && form.brand_id !== "none" ? Number(form.brand_id) : null,
  });

  const ItemForm = ({ onSubmit, loading }: any) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Nombre *</Label>
          <Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Precio venta (USD) *</Label>
          <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Costo (USD)</Label>
          <Input type="number" step="0.01" min="0" value={form.cost} onChange={e => setForm((f: any) => ({ ...f, cost: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Stock</Label>
          <Input type="number" min="0" value={form.stock} onChange={e => setForm((f: any) => ({ ...f, stock: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={form.category_id} onValueChange={v => setForm((f: any) => ({ ...f, category_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin categoría</SelectItem>
              {(cats?.items ?? []).map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Marca</Label>
          <Select value={form.brand_id} onValueChange={v => setForm((f: any) => ({ ...f, brand_id: v }))}>
            <SelectTrigger><SelectValue placeholder="Sin marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin marca</SelectItem>
              {(brands?.items ?? []).map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className="w-full min-h-[70px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
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
            <h1 className="font-serif text-2xl font-bold">Productos</h1>
            <p className="text-sm text-muted-foreground">{items.length} productos</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowCreate(true); }} className="gap-2"><Plus size={16} />Nuevo Producto</Button>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar productos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-muted-foreground">Cargando...</div> :
              items.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No hay productos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Precio</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Stock</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Categoría</th>
                        <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 font-medium">{item.name}</td>
                          <td className="px-5 py-3.5 font-semibold text-primary">${Number(item.price).toFixed(2)}</td>
                          <td className="px-5 py-3.5">{item.stock}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{item.category_name || "-"}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setForm({
                                  name: item.name,
                                  description: item.description || "",
                                  price: String(item.price),
                                  cost: item.cost != null ? String(item.cost) : "",
                                  stock: String(item.stock ?? 0),
                                  category_id: item.category_id ? String(item.category_id) : "none",
                                  brand_id: item.brand_id ? String(item.brand_id) : "none",
                                });
                                setShowEdit(item);
                              }}>Editar</Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("¿Eliminar producto?")) deleteMutation.mutate({ id: item.id }); }}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Producto</DialogTitle></DialogHeader>
          <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ data: buildPayload() as any }); }} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Producto</DialogTitle></DialogHeader>
          {showEdit && <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate({ id: showEdit.id, data: buildPayload() as any }); }} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
