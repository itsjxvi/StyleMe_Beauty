import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth";

// Public pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Booking from "@/pages/Booking";
import NotFound from "@/pages/not-found";

// Admin pages
import Dashboard from "@/pages/admin/Dashboard";
import Appointments from "@/pages/admin/Appointments";
import Calendar from "@/pages/admin/Calendar";
import Reviews from "@/pages/admin/Reviews";
import Reports from "@/pages/admin/Reports";
import Users from "@/pages/admin/Users";
import Services from "@/pages/admin/inventory/Services";
import Products from "@/pages/admin/inventory/Products";
import Categories from "@/pages/admin/inventory/Categories";
import Brands from "@/pages/admin/inventory/Brands";
import Providers from "@/pages/admin/inventory/Providers";
import Stock from "@/pages/admin/inventory/Stock";
import Invoices from "@/pages/admin/billing/Invoices";
import Payments from "@/pages/admin/billing/Payments";
import Expenses from "@/pages/admin/billing/Expenses";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const allowed = !!user && (user.role === "admin" || user.role === "employee");

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    } else if (user.role !== "admin" && user.role !== "employee") {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!allowed) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/registro" component={Register} />
      <Route path="/citas" component={Booking} />

      {/* Admin */}
      <Route path="/admin/dashboard" component={() => <AdminRoute component={Dashboard} />} />
      <Route path="/admin/citas" component={() => <AdminRoute component={Appointments} />} />
      <Route path="/admin/calendario" component={() => <AdminRoute component={Calendar} />} />
      <Route path="/admin/resenas" component={() => <AdminRoute component={Reviews} />} />
      <Route path="/admin/reportes" component={() => <AdminRoute component={Reports} />} />
      <Route path="/admin/usuarios" component={() => <AdminRoute component={Users} />} />
      <Route path="/admin/inventario/servicios" component={() => <AdminRoute component={Services} />} />
      <Route path="/admin/inventario/productos" component={() => <AdminRoute component={Products} />} />
      <Route path="/admin/inventario/categorias" component={() => <AdminRoute component={Categories} />} />
      <Route path="/admin/inventario/marcas" component={() => <AdminRoute component={Brands} />} />
      <Route path="/admin/inventario/proveedores" component={() => <AdminRoute component={Providers} />} />
      <Route path="/admin/inventario/stock" component={() => <AdminRoute component={Stock} />} />
      <Route path="/admin/facturacion/facturas" component={() => <AdminRoute component={Invoices} />} />
      <Route path="/admin/facturacion/pagos" component={() => <AdminRoute component={Payments} />} />
      <Route path="/admin/facturacion/gastos" component={() => <AdminRoute component={Expenses} />} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
