import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useListProducts, useListCategories, useListBrands } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scissors, ShoppingCart, Search, Tag, Package, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/cart";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";

export default function Tienda() {
  const { data: productsData } = useListProducts();
  const { data: categoriesData } = useListCategories();
  const { data: brandsData } = useListBrands();
  const { add, count, items: cartItems } = useCart();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<number | null>(null);
  const [promos, setPromos] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/promotions/active").then(r => setPromos(r.items ?? [])).catch(() => {});
  }, []);

  const products = (productsData?.items ?? []).filter((p: any) => p.is_active !== false);
  const cats = categoriesData?.items ?? [];
  const brands = brandsData?.items ?? [];
  const brandMap = Object.fromEntries(brands.map((b: any) => [b.id, b.name]));

  const filtered = products.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && p.category_id !== catFilter) return false;
    return true;
  });

  const addToCart = (p: any) => {
    if (!user) {
      toast({ title: "Inicia sesión", description: "Necesitas una cuenta para comprar.", variant: "destructive" });
      return;
    }
    add({ product_id: p.id, name: p.name, price: Number(p.price) });
    toast({ title: "Agregado al carrito", description: p.name });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Scissors size={16} className="text-white" />
              </div>
              <span className="font-serif font-bold text-xl">StyleMe Beauty</span>
            </div>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/"><Button variant="ghost" size="sm">Inicio</Button></Link>
            <Link href="/tienda"><Button variant="ghost" size="sm" className="font-semibold">Tienda</Button></Link>
            <Link href="/citas"><Button variant="ghost" size="sm">Reservar</Button></Link>
            {!user && <Link href="/login"><Button variant="outline" size="sm">Iniciar sesión</Button></Link>}
            {user && <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>}
            <Link href="/carrito">
              <Button variant="default" size="sm" className="gap-1.5 relative">
                <ShoppingCart size={14} /> Carrito
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="pt-28 pb-8 bg-gradient-to-br from-primary/5 to-background">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="font-serif text-4xl font-bold mb-2">Tienda online</h1>
          <p className="text-muted-foreground">Productos de belleza, cuidado y maquillaje. Compra desde la web con envío a domicilio.</p>

          {promos.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {promos.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm">
                  <Tag size={14} className="text-primary" />
                  <span className="font-semibold">{p.name}</span>
                  {p.code && <Badge variant="secondary">{p.code}</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar productos..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant={catFilter === null ? "default" : "outline"} size="sm" onClick={() => setCatFilter(null)}>Todos</Button>
              {cats.map((c: any) => (
                <Button key={c.id} variant={catFilter === c.id ? "default" : "outline"} size="sm" onClick={() => setCatFilter(c.id)}>{c.name}</Button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-40" />
              No hay productos disponibles.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((p: any) => {
                const inCart = cartItems.find(x => x.product_id === p.id);
                return (
                  <Card key={p.id} className="overflow-hidden hover-elevate">
                    <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Package size={48} className="text-primary/40" />
                    </div>
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground mb-1">{brandMap[p.brand_id] ?? "—"}</div>
                      <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                      <div className="flex items-end justify-between mt-3">
                        <p className="text-lg font-bold text-primary">${Number(p.price).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 gap-1.5"
                        onClick={() => addToCart(p)}
                        disabled={p.stock <= 0}
                      >
                        <ShoppingCart size={14} />
                        {p.stock <= 0 ? "Sin stock" : inCart ? `En carrito (${inCart.quantity})` : "Agregar"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
