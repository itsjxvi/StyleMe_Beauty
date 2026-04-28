import { useState } from "react";
import { useListInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice, useListAppointments } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = { draft: "Borrador", issued: "Emitida", paid: "Pagada", cancelled: "Cancelada" };
const STATUS_COLORS: Record<string, string> = { draft: "bg-gray-100 text-gray-600", issued: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-600" };

const EMPTY = { appointment_id: "", client_name: "", subtotal: "", tax: "0", discount: "0", total: "", status: "draft", notes: "" };

export default function Invoices() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListInvoices({ search: search || undefined });
  const items = data?.items ?? [];
  const { data: aptsData } = useListAppointments();
  const appointments = aptsData?.items ?? [];

  const createMutation = useCreateInvoice({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY); toast({ title: "Factura creada" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const updateMutation = useUpdateInvoice({ mutation: { onSuccess: () => { refetch(); setShowEdit(null); toast({ title: "Factura actualizada" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });
  const deleteMutation = useDeleteInvoice({ mutation: { onSuccess: () => { refetch(); toast({ title: "Factura eliminada" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });

  const buildData = () => ({
    appointment_id: form.appointment_id ? Number(form.appointment_id) : undefined,
    client_name: form.client_name || undefined,
    subtotal: String(form.subtotal),
    tax: String(form.tax || 0),
    discount: String(form.discount || 0),
    total: String(form.total || form.subtotal),
    status: form.status,
    notes: form.notes || undefined,
  });

  const ItemForm = ({ onSubmit, loading }: any) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Nombre del cliente</Label>
          <Input value={form.client_name} onChange={e => setForm((f: any) => ({ ...f, client_name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Subtotal ($) *</Label>
          <Input type="number" step="0.01" value={form.subtotal} onChange={e => setForm((f: any) => ({ ...f, subtotal: e.target.value, total: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Impuesto ($)</Label>
          <Input type="number" step="0.01" value={form.tax} onChange={e => setForm((f: any) => ({ ...f, tax: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Descuento ($)</Label>
          <Input type="number" step="0.01" value={form.discount} onChange={e => setForm((f: any) => ({ ...f, discount: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Total ($) *</Label>
          <Input type="number" step="0.01" value={form.total} onChange={e => setForm((f: any) => ({ ...f, total: e.target.value }))} required />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Estado</Label>
          <Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
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
            <h1 className="font-serif text-2xl font-bold">Facturas</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} facturas</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowCreate(true); }} className="gap-2"><Plus size={16} />Nueva Factura</Button>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-muted-foreground">Cargando...</div> :
              items.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No hay facturas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">#</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cliente</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Total</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                        <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 text-muted-foreground">#{item.invoice_number || item.id}</td>
                          <td className="px-5 py-3.5 font-medium">{item.client_name || "-"}</td>
                          <td className="px-5 py-3.5 font-semibold text-primary">${Number(item.total).toLocaleString()}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[item.status] || "bg-muted"}`}>
                              {STATUS_LABELS[item.status] || item.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">{new Date(item.created_at).toLocaleDateString("es-CR")}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setForm({ appointment_id: item.appointment_id || "", client_name: item.client_name || "", subtotal: item.subtotal, tax: item.tax, discount: item.discount, total: item.total, status: item.status, notes: item.notes || "" });
                                setShowEdit(item);
                              }}>Editar</Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("¿Eliminar factura?")) deleteMutation.mutate({ id: item.id }); }}>
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
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Nueva Factura</DialogTitle></DialogHeader>
          <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ data: buildData() as any }); }} loading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Editar Factura</DialogTitle></DialogHeader>
          {showEdit && <ItemForm onSubmit={(e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate({ id: showEdit.id, data: buildData() as any }); }} loading={updateMutation.isPending} />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
