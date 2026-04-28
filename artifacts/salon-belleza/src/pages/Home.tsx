import { Link } from "wouter";
import { useState } from "react";
import { useListServices, useListBrands, useListProducts, useListReviews, useGetReviewStats, useCreateReview } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Scissors, Clock, Star, Phone, MapPin, ChevronRight, Sparkles, Package, Tag, LogOut, LayoutDashboard, MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const isStaff = user?.role === "admin" || user?.role === "employee";
  const { data: servicesData, isLoading } = useListServices();
  const { data: brandsData } = useListBrands(undefined, { query: { enabled: !!user } });
  const { data: productsData } = useListProducts(undefined, { query: { enabled: !!user } });
  const { data: reviewsData, refetch: refetchReviews } = useListReviews({ published: true });
  const { data: reviewStats } = useGetReviewStats();

  const services = servicesData?.items ?? [];
  const brands = brandsData?.items ?? [];
  const products = (productsData?.items ?? []).filter((p: any) => p.is_active !== false);
  const reviews = reviewsData?.items ?? [];

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ client_name: user?.full_name ?? "", rating: 5, comment: "", service_id: "" });

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        toast({ title: "¡Gracias por tu reseña!", description: "Tu opinión será publicada pronto." });
        setShowReviewForm(false);
        setReviewForm({ client_name: user?.full_name ?? "", rating: 5, comment: "", service_id: "" });
        refetchReviews();
      },
      onError: () => toast({ title: "Error al enviar", variant: "destructive" }),
    },
  });

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    createReview.mutate({
      data: {
        client_name: reviewForm.client_name,
        rating: reviewForm.rating,
        comment: reviewForm.comment || undefined,
        service_id: reviewForm.service_id ? Number(reviewForm.service_id) : undefined,
      },
    });
  };

  const avgRating = reviewsData?.average ?? 0;
  const totalReviews = reviewsData?.total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors size={16} className="text-white" />
            </div>
            <span className="font-serif font-bold text-xl text-foreground">Salón de Belleza</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#servicios" className="text-muted-foreground hover:text-foreground transition-colors">Servicios</a>
            <a href="#resenas" className="text-muted-foreground hover:text-foreground transition-colors">Reseñas</a>
            {user && <a href="#marcas" className="text-muted-foreground hover:text-foreground transition-colors">Marcas</a>}
            {user && <a href="#productos" className="text-muted-foreground hover:text-foreground transition-colors">Productos</a>}
            <a href="#contacto" className="text-muted-foreground hover:text-foreground transition-colors">Contacto</a>
            {!user && (
              <>
                <Link href="/registro">
                  <Button variant="ghost" size="sm">Registrarse</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="sm">Iniciar Sesión</Button>
                </Link>
              </>
            )}
            {user && (
              <>
                <span className="text-muted-foreground">Hola, {user.full_name.split(" ")[0]}</span>
                {isStaff && (
                  <Link href="/admin/dashboard">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <LayoutDashboard size={14} />
                      Administración
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
                  <LogOut size={14} />
                  Salir
                </Button>
              </>
            )}
          </nav>
          <Link href="/citas" className="md:hidden">
            <Button size="sm">Reservar</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-rose-50 via-pink-50/30 to-background">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles size={14} />
              Salon Unisex Profesional
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Salón de
              <br />
              <span className="text-primary">Belleza</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
              Refleja tu belleza interior
            </p>
            <p className="text-muted-foreground mb-10 leading-relaxed">
              Nuestro equipo de estilistas expertos está aquí para realzar tu estilo. 
              Descubre una experiencia exclusiva de belleza hecha a tu medida.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/citas">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                  Reservar Cita
                  <ChevronRight size={18} />
                </Button>
              </Link>
              <a href="#servicios">
                <Button size="lg" variant="outline">
                  Ver Servicios
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Clientes satisfechos" },
              { number: "5+", label: "Años de experiencia" },
              { number: "15+", label: "Servicios disponibles" },
              { number: "100%", label: "Satisfacción garantizada" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-serif text-3xl font-bold text-primary">{stat.number}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands (logged-in users only) */}
      {user && brands.length > 0 && (
        <section id="marcas" className="py-20 bg-card border-y border-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-3">Nuestras Marcas</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Trabajamos con las marcas más reconocidas del mundo de la belleza
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand: any) => (
                <Card key={brand.id} className="hover:shadow-md transition-shadow border-border/60 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Tag size={18} className="text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground pt-2">{brand.name}</h3>
                    </div>
                    {brand.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{brand.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products (logged-in users only) */}
      {user && products.length > 0 && (
        <section id="productos" className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-3">Nuestros Productos</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Conoce los productos que tenemos disponibles para ti
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => {
                const brand = brands.find((b: any) => b.id === product.brand_id);
                return (
                  <Card key={product.id} className="hover:shadow-md transition-shadow border-border/60 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Package size={18} className="text-primary" />
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary text-lg">
                            ${Number(product.price).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                      {brand && (
                        <p className="text-xs text-primary/80 mb-2">{brand.name}</p>
                      )}
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section id="servicios" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-3">Nuestros Servicios</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ofrecemos una amplia gama de servicios de belleza para realzar tu imagen
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-3 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <Card key={service.id} className="hover:shadow-md transition-shadow border-border/60 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Scissors size={18} className="text-primary" />
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary text-lg">
                          ${Number(service.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12} />
                      <span>{service.duration_minutes} minutos</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/citas">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/25">
                Reservar tu cita ahora
                <ChevronRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="resenas" className="py-20 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold mb-3">Lo que dicen nuestros clientes</h2>
            {totalReviews > 0 && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={20} className={i <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                  ))}
                </div>
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">({totalReviews} reseñas)</span>
              </div>
            )}
            <p className="text-muted-foreground">Comparte tu experiencia con nosotros</p>
            <Button onClick={() => setShowReviewForm(true)} className="mt-4 gap-2">
              <MessageSquarePlus size={16} /> Dejar una reseña
            </Button>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((r: any) => (
                <Card key={r.id} className="border-border/60">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={14} className={i <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground italic mb-4">"{r.comment}"</p>}
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                        {r.client_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{r.client_name}</p>
                        {r.service_name && <p className="text-xs text-muted-foreground">{r.service_name}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">Aún no hay reseñas. ¡Sé la primera persona en dejar una!</p>
          )}

          {(reviewStats?.by_service?.length ?? 0) > 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">Top servicios mejor valorados</p>
                  <div className="space-y-2">
                    {reviewStats?.by_service.slice(0, 3).map((s: any) => (
                      <div key={s.service_id} className="flex items-center justify-between text-sm">
                        <span>{s.service_name}</span>
                        <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                          <Star size={12} className="fill-yellow-400" />{s.average.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {(reviewStats?.by_employee?.length ?? 0) > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Estilistas mejor valorados</p>
                    <div className="space-y-2">
                      {reviewStats?.by_employee.slice(0, 3).map((e: any) => (
                        <div key={e.employee_id} className="flex items-center justify-between text-sm">
                          <span>{e.employee_name}</span>
                          <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                            <Star size={12} className="fill-yellow-400" />{e.average.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Comparte tu experiencia</DialogTitle></DialogHeader>
          <form onSubmit={submitReview} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tu nombre *</Label>
              <Input value={reviewForm.client_name} onChange={e => setReviewForm(f => ({ ...f, client_name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Calificación *</Label>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <button key={i} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: i }))}>
                    <Star size={28} className={i <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Servicio (opcional)</Label>
              <select className="w-full h-10 px-3 text-sm border border-input rounded-md bg-background" value={reviewForm.service_id} onChange={e => setReviewForm(f => ({ ...f, service_id: e.target.value }))}>
                <option value="">Sin especificar</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Comentario (opcional)</Label>
              <textarea className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createReview.isPending}>{createReview.isPending ? "Enviando..." : "Enviar reseña"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Why us */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold mb-3">Por qué elegirnos</h2>
            <p className="text-muted-foreground">Lo que nos hace diferentes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Star className="text-primary" />, title: "Profesionales expertos", desc: "Nuestro equipo cuenta con años de experiencia y certificaciones internacionales." },
              { icon: <Sparkles className="text-primary" />, title: "Productos premium", desc: "Trabajamos con las mejores marcas del mercado para garantizar resultados excepcionales." },
              { icon: <Phone className="text-primary" />, title: "Atención personalizada", desc: "Cada cliente recibe un servicio único y adaptado a sus necesidades." },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-background rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contacto" className="py-20 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-4">Contacto</h2>
              <p className="text-muted-foreground mb-8">
                Estamos listos para atenderte. Visítanos o llámanos para agendar tu cita.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Teléfono</p>
                    <p className="text-muted-foreground text-sm">&nbsp;</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Dirección</p>
                    <p className="text-muted-foreground text-sm">&nbsp;</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Horario</p>
                    <p className="text-muted-foreground text-sm">Lunes a Sábado, 8:00 - 18:00</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/30 rounded-2xl p-8 text-center">
              <Scissors size={48} className="text-primary mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-bold mb-3">Reserva tu cita</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Agenda tu próxima visita de manera fácil y rápida
              </p>
              <Link href="/citas">
                <Button size="lg" className="shadow-lg shadow-primary/25">
                  Reservar Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Scissors size={16} className="text-primary" />
            <span className="font-serif font-bold text-foreground">Salón de Belleza</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Refleja tu belleza interior
          </p>
        </div>
      </footer>
    </div>
  );
}
