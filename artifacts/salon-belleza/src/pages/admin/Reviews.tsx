import { useState } from "react";
import { useListReviews, useDeleteReview, useUpdateReview, useGetReviewStats } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Trash2, Eye, EyeOff, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "hidden">("all");
  const { toast } = useToast();

  const { data, refetch } = useListReviews();
  const { data: stats } = useGetReviewStats();

  const items = (data?.items ?? []).filter((r: any) => {
    if (filterPublished === "published") return r.is_published === 1;
    if (filterPublished === "hidden") return r.is_published === 0;
    return true;
  });

  const deleteMutation = useDeleteReview({
    mutation: { onSuccess: () => { refetch(); toast({ title: "Reseña eliminada" }); } },
  });
  const updateMutation = useUpdateReview({
    mutation: { onSuccess: () => { refetch(); toast({ title: "Reseña actualizada" }); } },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold">Reseñas</h1>
          <p className="text-sm text-muted-foreground">Opiniones de clientes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Promedio general</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold">{(data?.average ?? 0).toFixed(1)}</p>
                <StarRating rating={Math.round(data?.average ?? 0)} size={18} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{data?.total ?? 0} reseñas en total</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-2">Top servicios</p>
              <div className="space-y-1.5">
                {(stats?.by_service ?? []).slice(0, 3).map((s: any) => (
                  <div key={s.service_id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{s.service_name}</span>
                    <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                      <Star size={12} className="fill-yellow-400" />{s.average.toFixed(1)}
                    </span>
                  </div>
                ))}
                {!stats?.by_service?.length && <p className="text-xs text-muted-foreground">Sin datos</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-2">Top empleados</p>
              <div className="space-y-1.5">
                {(stats?.by_employee ?? []).slice(0, 3).map((e: any) => (
                  <div key={e.employee_id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{e.employee_name}</span>
                    <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                      <Star size={12} className="fill-yellow-400" />{e.average.toFixed(1)}
                    </span>
                  </div>
                ))}
                {!stats?.by_employee?.length && <p className="text-xs text-muted-foreground">Sin datos</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2">
          {(["all", "published", "hidden"] as const).map(k => (
            <button
              key={k}
              onClick={() => setFilterPublished(k)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${filterPublished === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {k === "all" ? "Todas" : k === "published" ? "Visibles" : "Ocultas"}
            </button>
          ))}
        </div>

        <Card className="border-border/60">
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                <p>Sin reseñas</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((r: any) => (
                  <div key={r.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold">{r.client_name}</p>
                          <StarRating rating={r.rating} />
                          {r.service_name && <span className="text-xs text-muted-foreground">· {r.service_name}</span>}
                          {r.employee_name && <span className="text-xs text-muted-foreground">· {r.employee_name}</span>}
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString("es-ES")}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateMutation.mutate({ id: r.id, data: { is_published: r.is_published === 1 ? 0 : 1 } })}
                          title={r.is_published === 1 ? "Ocultar" : "Mostrar"}
                        >
                          {r.is_published === 1 ? <Eye size={16} /> : <EyeOff size={16} className="text-muted-foreground" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate({ id: r.id })}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
