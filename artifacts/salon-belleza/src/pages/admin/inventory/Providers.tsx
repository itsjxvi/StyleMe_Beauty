import { useState } from "react";
import { useListProviders, useCreateProvider, useUpdateProvider, useDeleteProvider } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Truck, Trash2, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EMPTY = { name: "", contact_name: "", phone: "", email: "", address: "" };

export default function Providers() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListProviders({ search: search || undefined });
  const items = data?.items ?? [];

  const createMutation = useCreateProvider({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY); toast({ title: "Proveedor creado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const updateMutation = useUpdateProvider({ mutation: { onSuccess: () => { refetch(); setShowEdit(null); toast({ title: "Proveedor actualizado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const deleteMutation = useDeleteProvider({ mutation: { onSuccess: () => { refetch(); toast({ title: "Proveedor eliminado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });

  const ItemForm = ({ onSubmit, loading }: any) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Nombre del proveedor *</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Persona de contacto</Label>
          <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Correo</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Dirección</Label>
          <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
      </div>
      <DialogFooter><Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button></DialogFooter>
    </form>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Proveedores</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} proveedores</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowCreate(true); }} className="gap-2"><Plus size={16} />Nuevo Proveedor</Button>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar proveedores..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />) :
            items.map((item: any) => (
              <Card key={item.id} className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Truck size={18} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.contact_name && <p className="text-sm text-muted-foreground">{item.contact_name}</p>}
                    </div>
                  </div>
                  <div className="space-y-1 mb-4">
                    {item.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone size={12} />{item.phone}
                      </div>
                    )}
                    {item.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={12} />{item.email}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { setForm({ name: item.name, contact_name: item.contact_name || "", phone: item.phone || "", email: item.email || "", address: item.address || "" }); setShowEdit(item); }}>Editar</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm("¿Eliminar?")) deleteMutation.mutate({ id: item.id }); }}><Trash2 size={14} /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo Proveedor</DialogTitle></DialogHeader>
          <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ data: { name: form.name, contact_name: form.contact_name || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined } }); }} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Proveedor</DialogTitle></DialogHeader>
          {showEdit && <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate({ id: showEdit.id, data: { name: form.name, contact_name: form.contact_name || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined } }); }} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
