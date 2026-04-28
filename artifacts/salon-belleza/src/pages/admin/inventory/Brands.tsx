import { useState } from "react";
import { useListBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Bookmark, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Brands() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListBrands();
  const items = (data?.items ?? []).filter((i: any) => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const createMutation = useCreateBrand({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); setForm({ name: "", description: "" }); toast({ title: "Marca creada" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const updateMutation = useUpdateBrand({ mutation: { onSuccess: () => { refetch(); setShowEdit(null); toast({ title: "Marca actualizada" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const deleteMutation = useDeleteBrand({ mutation: { onSuccess: () => { refetch(); toast({ title: "Marca eliminada" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });

  const ItemForm = ({ onSubmit, loading }: any) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nombre *</Label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      </div>
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full min-h-[70px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
      <DialogFooter><Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button></DialogFooter>
    </form>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Marcas</h1>
            <p className="text-sm text-muted-foreground">{items.length} marcas</p>
          </div>
          <Button onClick={() => { setForm({ name: "", description: "" }); setShowCreate(true); }} className="gap-2"><Plus size={16} />Nueva Marca</Button>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />) :
            items.map((item: any) => (
              <Card key={item.id} className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bookmark size={16} className="text-primary" />
                    </div>
                    <h3 className="font-semibold">{item.name}</h3>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setForm({ name: item.name, description: item.description || "" }); setShowEdit(item); }}>Editar</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("¿Eliminar?")) deleteMutation.mutate({ id: item.id }); }}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Nueva Marca</DialogTitle></DialogHeader>
          <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ data: { name: form.name, description: form.description || undefined } }); }} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Marca</DialogTitle></DialogHeader>
          {showEdit && <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate({ id: showEdit.id, data: { name: form.name, description: form.description || undefined } }); }} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
