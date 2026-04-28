import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users as UsersIcon, Trash2, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", employee: "Empleado", client: "Cliente" };
const ROLE_COLORS: Record<string, string> = { admin: "bg-purple-100 text-purple-700", employee: "bg-blue-100 text-blue-700", client: "bg-green-100 text-green-700" };

const EMPTY = { full_name: "", email: "", password: "", phone: "", role: "client", is_active: true };

export default function Users() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListUsers({ search: search || undefined });
  const users = data?.items ?? [];

  const createMutation = useCreateUser({ mutation: { onSuccess: () => { refetch(); setShowCreate(false); setForm(EMPTY); toast({ title: "Usuario creado" }); }, onError: () => toast({ title: "Error al crear usuario", variant: "destructive" }) } });
  const updateMutation = useUpdateUser({ mutation: { onSuccess: () => { refetch(); setShowEdit(null); toast({ title: "Usuario actualizado" }); }, onError: () => toast({ title: "Error al actualizar", variant: "destructive" }) } });
  const deleteMutation = useDeleteUser({ mutation: { onSuccess: () => { refetch(); toast({ title: "Usuario eliminado" }); }, onError: () => toast({ title: "Error al eliminar", variant: "destructive" }) } });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: { full_name: form.full_name, email: form.email, password: form.password, phone: form.phone || undefined, role: form.role, is_active: form.is_active } });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const upd: any = { full_name: form.full_name, email: form.email, phone: form.phone || undefined, role: form.role, is_active: form.is_active };
    if (form.password) upd.password = form.password;
    updateMutation.mutate({ id: showEdit.id, data: upd });
  };

  const openEdit = (u: any) => {
    setForm({ full_name: u.full_name, email: u.email, password: "", phone: u.phone || "", role: u.role, is_active: u.is_active });
    setShowEdit(u);
  };

  const UserForm = ({ onSubmit, loading, isEdit }: any) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Nombre completo *</Label>
          <Input value={form.full_name} onChange={e => setForm((f: any) => ({ ...f, full_name: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Correo electrónico *</Label>
          <Input type="email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>{isEdit ? "Nueva contraseña (vacío = sin cambios)" : "Contraseña *"}</Label>
          <Input type="password" value={form.password} onChange={e => setForm((f: any) => ({ ...f, password: e.target.value }))} required={!isEdit} />
        </div>
        <div className="space-y-1.5">
          <Label>Rol</Label>
          <Select value={form.role} onValueChange={v => setForm((f: any) => ({ ...f, role: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select value={form.is_active ? "active" : "inactive"} onValueChange={v => setForm((f: any) => ({ ...f, is_active: v === "active" }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
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
            <h1 className="font-serif text-2xl font-bold">Usuarios</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} usuarios</p>
          </div>
          <Button onClick={() => { setForm(EMPTY); setShowCreate(true); }} className="gap-2">
            <Plus size={16} />Nuevo Usuario
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar usuarios..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <UsersIcon size={40} className="mx-auto mb-3 opacity-30" />
                <p>No hay usuarios</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Correo</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Rol</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">{u.full_name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                            <span className="font-medium">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{u.email}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] || "bg-muted text-muted-foreground"}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className={`flex items-center gap-1.5 text-xs font-medium ${u.is_active ? "text-green-600" : "text-red-500"}`}>
                            {u.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                            {u.is_active ? "Activo" : "Inactivo"}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Editar</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("¿Eliminar este usuario?")) deleteMutation.mutate({ id: u.id }); }}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo Usuario</DialogTitle></DialogHeader>
          <UserForm onSubmit={handleCreate} loading={createMutation.isPending} isEdit={false} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Usuario</DialogTitle></DialogHeader>
          {showEdit && <UserForm onSubmit={handleUpdate} loading={updateMutation.isPending} isEdit={true} />}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
