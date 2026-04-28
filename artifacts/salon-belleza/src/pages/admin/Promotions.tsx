import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tag, Plus, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { useToast } from "@/hooks/use-toast";

const empty = { name: "", description: "", code: "", type: "percent", value: 10, applies_to: "all", min_amount: 0, is_active: true };

export default function Promotions() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(empty); };

  const load = async () => {
    setLoading(true);
    try { setItems((await apiFetch("/promotions")).items ?? []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openDialog = (p: any | null) => {
    setEditing(p);
    setForm(p ? { ...p } : empty);
    setDialogOpen(true);
  };

  const save = async () => {
    try {
      const body = JSON.stringify({ ...form, value: Number(form.value), min_amount: Number(form.min_amount) });
      if (editing) await apiFetch(`/promotions/${editing.id}`, { method: "PUT", body });
      else await apiFetch("/promotions", { method: "POST", body });
      toast({ title: editing ? "Promoción actualizada" : "Promoción creada" });
      closeDialog(); load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const del = async (id: number) => {
    if (!confirm("¿Eliminar promoción?")) return;
    try { await apiFetch(`/promotions/${id}`, { method: "DELETE" }); toast({ title: "Eliminada" }); load(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold flex items-center gap-2"><Tag size={24} />Promociones y descuentos</h1>
            <p className="text-sm text-muted-foreground">Códigos visibles en la tienda y aplicables al checkout.</p>
          </div>
          <Button onClick={() => openDialog(null)} className="gap-1.5"><Plus size={14} />Nueva promoción</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Promociones</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-8 text-muted-foreground">Cargando…</p> :
              items.length === 0 ? <p className="text-center py-8 text-muted-foreground">Sin promociones.</p> :
              <div className="divide-y divide-border">
                {items.map(p => (
                  <div key={p.id} className="py-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><Tag size={16} className="text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{p.name}</span>
                        {p.code && <Badge variant="secondary">{p.code}</Badge>}
                        {!p.is_active && <Badge variant="outline">Inactiva</Badge>}
                        <Badge variant="outline" className="capitalize">{p.applies_to}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.type === "percent" ? `${Number(p.value)}% descuento` : `$${Number(p.value).toFixed(2)} descuento`}
                        {Number(p.min_amount) > 0 && ` · mín $${Number(p.min_amount).toFixed(2)}`}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDialog(p)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => del(p.id)}><Trash2 size={14} /></Button>
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar promoción" : "Nueva promoción"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descripción</Label><Textarea value={form.description ?? ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Código</Label><Input value={form.code ?? ""} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EJ: SALON20" /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Porcentaje</SelectItem>
                    <SelectItem value="amount">Monto fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Valor {form.type === "percent" ? "(%)" : "($)"}</Label><Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
              <div><Label>Mín. compra ($)</Label><Input type="number" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: e.target.value })} /></div>
              <div className="col-span-2">
                <Label>Aplica a</Label>
                <Select value={form.applies_to} onValueChange={v => setForm({ ...form, applies_to: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo</SelectItem>
                    <SelectItem value="products">Productos</SelectItem>
                    <SelectItem value="services">Servicios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="active" checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label htmlFor="active" className="cursor-pointer">Activa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Guardar" : "Crear"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
