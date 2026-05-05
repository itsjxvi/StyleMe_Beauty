import { useState } from "react";
import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from "@workspace/api-client-react";
import { Bell, Check, Trash2, Calendar, AlertTriangle, Star, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_ICONS: Record<string, any> = {
  reminder: Calendar,
  confirmation: Check,
  cancellation: X,
  low_stock: AlertTriangle,
  review: Star,
  info: Info,
};

const TYPE_COLORS: Record<string, string> = {
  reminder: "text-blue-600 bg-blue-50",
  confirmation: "text-green-600 bg-green-50",
  cancellation: "text-red-600 bg-red-50",
  low_stock: "text-orange-600 bg-orange-50",
  review: "text-yellow-600 bg-yellow-50",
  info: "text-gray-600 bg-gray-50",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, refetch } = useListNotifications();
  const items = data?.items ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const markRead = useMarkNotificationRead({ mutation: { onSuccess: () => refetch() } });
  const markAll = useMarkAllNotificationsRead({ mutation: { onSuccess: () => refetch() } });
  const del = useDeleteNotification({ mutation: { onSuccess: () => refetch() } });

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      markAll.mutate();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative w-9 h-9 rounded-full hover:bg-accent flex items-center justify-center transition"
      >
        <Bell size={18} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-96 bg-background border border-border rounded-xl shadow-xl z-50 max-h-[500px] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <p className="font-semibold text-sm">Notificaciones</p>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAll.mutate()}>
                  Marcar todas
                </Button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {items.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <Bell size={32} className="mx-auto mb-2 opacity-30" />
                  Sin notificaciones
                </div>
              ) : (
                items.map((n: any) => {
                  const Icon = TYPE_ICONS[n.type] || Info;
                  return (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-border hover:bg-accent/30 transition ${!n.is_read ? "bg-blue-50/30" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type]}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!n.is_read && (
                            <button onClick={() => markRead.mutate({ id: n.id })} title="Marcar leída" className="text-muted-foreground hover:text-primary">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => del.mutate({ id: n.id })} title="Eliminar" className="text-muted-foreground hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
