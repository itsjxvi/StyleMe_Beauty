import { useState } from "react";
import { useListPayments, useCreatePayment, useDeletePayment, useListInvoices } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const METHOD_LABELS: Record<string, string> = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", other: "Otro" };
const METHOD_COLORS: Record<string, string> = { cash: "bg-green-100 text-green-700", card: "bg-blue-100 text-blue-700", transfer: "bg-purple-100 text-purple-700", other: "bg-gray-100 text-gray-600" };

const EMPTY = { invoice_id: "", amount: "", payment_method: "cash", reference_number: "", notes: "" };

export default function Payments() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListPayments();
  const { data: invoicesData } = useListInvoices();
  const items = data?.items ?? [];
  const invoices = invoicesData?.items ?? [];

  const createMutation = useCreatePayment({
    mutation: {
      onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY); toast({ title: "Pago registrado" }); },
      onError: () => toast({ title: "Error", variant: "destructive" })
    }
  });
  const deleteMutation = useDeletePayment({ mutation: { onSuccess: () => { refetch(); toast({ title: "Pago eliminado" }); }, onError: () => toast({ title: "Error", variant: "destructive" }) } });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">Pagos</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} pagos</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowCreate(true); }} className="gap-2"><Plus size={16} />Registrar Pago</Button>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            {isLoading ? <div className="p-8 text-center text-muted-foreground">Cargando...</div> :
              items.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Factura</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Monto</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Método</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Referencia</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                        <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {items.map((item: any) => {
                        const inv = invoices.find((i: any) => i.id === item.invoice_id);
                        return (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3.5 text-muted-foreground">#{inv?.invoice_number || item.invoice_id}</td>
                            <td className="px-5 py-3.5 font-semibold text-primary">${Number(item.amount).toLocaleString()}</td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${METHOD_COLORS[item.payment_method] || "bg-muted"}`}>
                                {METHOD_LABELS[item.payment_method] || item.payment_method}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">{item.reference_number || "-"}</td>
                            <td className="px-5 py-3.5 text-muted-foreground">{new Date(item.paid_at || item.created_at).toLocaleDateString("es-CR")}</td>
                            <td className="px-5 py-3.5 text-right">
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("¿Eliminar pago?")) deleteMutation.mutate({ id: item.id }); }}>
                                <Trash2 size={14} />
                              </Button>
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
          <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate({ data: { invoice_id: Number(form.invoice_id), amount: String(form.amount), payment_method: form.payment_method, reference_number: form.reference_number || undefined, notes: form.notes || undefined } }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Factura *</Label>
              <Select value={String(form.invoice_id)} onValueChange={v => setForm((f: any) => ({ ...f, invoice_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar factura" /></SelectTrigger>
                <SelectContent>
                  {invoices.map((i: any) => <SelectItem key={i.id} value={String(i.id)}>#{i.invoice_number || i.id} - {i.client_name} (${Number(i.total).toLocaleString()})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Monto ($) *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={e => setForm((f: any) => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Método de pago</Label>
                <Select value={form.payment_method} onValueChange={v => setForm((f: any) => ({ ...f, payment_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(METHOD_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Número de referencia</Label>
              <Input value={form.reference_number} onChange={e => setForm((f: any) => ({ ...f, reference_number: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Input value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} />
            </div>
            <DialogFooter><Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Guardando..." : "Registrar"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
