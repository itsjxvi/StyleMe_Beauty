import { useState } from "react";
import { useListExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingDown, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CAT_LABELS: Record<string, string> = { supplies: "Insumos", utilities: "Servicios", salary: "Salario", rent: "Alquiler", equipment: "Equipos", marketing: "Marketing", other: "Otro" };

const EMPTY = { category: "other", amount: "", description: "", date: new Date().toISOString().split("T")[0], notes: "" };

export default function Expenses() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListExpenses({ search: search || undefined });
  const items = data?.items ?? [];

  const createMutation = useCreateExpense({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY); toast({ title: "Gasto registrado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const updateMutation = useUpdateExpense({ mutation: { onSuccess: () => { refetch(); setShowEdit(null); toast({ title: "Gasto actualizado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const deleteMutation = useDeleteExpense({ mutation: { onSuccess: () => { refetch(); toast({ title: "Gasto eliminado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });

  const buildData = () => ({
    category: form.category,
    amount: String(form.amount),
    description: form.description,
    expense_date: form.date,
    notes: form.notes || undefined,
  });

  const ItemForm = ({ onSubmit, loading }: any) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={form.category} onValueChange={v => setForm((f: any) => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Monto ($) *</Label>
          <Input type="number" step="0.01" value={form.amount} onChange={e => setForm((f: any) => ({ ...f, amount: e.target.value }))} required />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Descripción *</Label>
          <Input value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} required />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Fecha *</Label>
          <Input type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notas</Label>
        <textarea value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} className="w-full min-h-[70px] px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>
      <DialogFooter><Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button></DialogFooter>
    </form>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Gastos</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} gastos registrados</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowCreate(true); }} className="gap-2"><Plus size={16} />Nuevo Gasto</Button>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar gastos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-muted-foreground">Cargando...</div> :
              items.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <TrendingDown size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No hay gastos registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Descripción</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Categoría</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Monto</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                        <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 font-medium">{item.description}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                              {CAT_LABELS[item.category] || item.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-red-600">${Number(item.amount).toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">
                            {new Date(item.expense_date || item.created_at).toLocaleDateString("es-CR")}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setForm({ category: item.category, amount: item.amount, description: item.description, date: (item.expense_date || item.created_at)?.split("T")[0], notes: item.notes || "" });
                                setShowEdit(item);
                              }}>Editar</Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("¿Eliminar gasto?")) deleteMutation.mutate({ id: item.id }); }}>
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
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Nuevo Gasto</DialogTitle></DialogHeader>
          <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ data: buildData() as any }); }} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Editar Gasto</DialogTitle></DialogHeader>
          {showEdit && <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate({ id: showEdit.id, data: buildData() as any }); }} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
