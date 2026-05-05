import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Calendar, Users, Package, Tag, Bookmark,
  Truck, BarChart3, FileText, CreditCard, TrendingDown, Layers,
  LogOut, ChevronDown, ChevronRight, Scissors, Star, PieChart, CalendarDays,
  ShoppingBag, Activity, Sparkles, UserCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string; icon: React.ReactNode }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/admin/dashboard" },
  { label: "Citas", icon: <Calendar size={18} />, href: "/admin/citas" },
  { label: "Calendario", icon: <CalendarDays size={18} />, href: "/admin/calendario" },
  { label: "Reseñas", icon: <Star size={18} />, href: "/admin/resenas" },
  { label: "Reportes", icon: <PieChart size={18} />, href: "/admin/reportes" },
  { label: "Ventas", icon: <ShoppingBag size={18} />, href: "/admin/ventas" },
  { label: "Promociones", icon: <Sparkles size={18} />, href: "/admin/promociones" },
  { label: "Actividad", icon: <Activity size={18} />, href: "/admin/actividad" },
  {
    label: "Usuarios", icon: <Users size={18} />,
    children: [
      { label: "Usuarios", href: "/admin/usuarios", icon: <Users size={16} /> },
    ]
  },
  {
    label: "Inventario", icon: <Package size={18} />,
    children: [
      { label: "Servicios", href: "/admin/inventario/servicios", icon: <Scissors size={16} /> },
      { label: "Productos", href: "/admin/inventario/productos", icon: <Package size={16} /> },
      { label: "Categorias", href: "/admin/inventario/categorias", icon: <Tag size={16} /> },
      { label: "Marcas", href: "/admin/inventario/marcas", icon: <Bookmark size={16} /> },
      { label: "Proveedores", href: "/admin/inventario/proveedores", icon: <Truck size={16} /> },
      { label: "Stock", href: "/admin/inventario/stock", icon: <Layers size={16} /> },
    ]
  },
  {
    label: "Facturación", icon: <BarChart3 size={18} />,
    children: [
      { label: "Facturas", href: "/admin/facturacion/facturas", icon: <FileText size={16} /> },
      { label: "Pagos", href: "/admin/facturacion/pagos", icon: <CreditCard size={16} /> },
      { label: "Gastos", href: "/admin/facturacion/gastos", icon: <TrendingDown size={16} /> },
    ]
  },
];

function NavGroup({ item }: { item: NavItem }) {
  const [location] = useLocation();
  const isChildActive = item.children?.some(c => location === c.href);
  const [open, setOpen] = useState(isChildActive ?? false);

  if (item.href) {
    const active = location === item.href;
    return (
      <Link href={item.href}>
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-colors",
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-colors",
          isChildActive
            ? "text-primary bg-accent"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        {item.icon}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && item.children && (
        <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
          {item.children.map(child => {
            const active = location === child.href;
            return (
              <Link key={child.href} href={child.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  )}
                >
                  {child.icon}
                  <span>{child.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors size={16} className="text-white" />
            </div>
            <div>
              <p className="font-serif font-semibold text-sm text-foreground">StyleMe Beauty</p>
              <p className="text-xs text-muted-foreground">Administración</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item, i) => (
            <NavGroup key={i} item={item} />
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Link href="/perfil">
            <Button variant="ghost" size="sm" className="w-full gap-2 mb-1.5">
              <UserCircle size={14} />
              Ver perfil
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={logout}
          >
            <LogOut size={14} />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center justify-end gap-3 px-8 py-3 border-b border-border bg-background sticky top-0 z-10">
          <NotificationBell />
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
