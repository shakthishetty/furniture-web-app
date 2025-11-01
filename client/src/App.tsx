import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import Navigation from "@/components/navigation";
import AdminLayout from "@/components/AdminLayout";
import ManufacturerLayout from "@/components/ManufacturerLayout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Product from "@/pages/product";
import New from "@/pages/new";
import Furniture from "@/pages/furniture";
import LivingRoom from "@/pages/living-room";
import Dining from "@/pages/dining";
import Bedroom from "@/pages/bedroom";
import Study from "@/pages/study";
import Outdoor from "@/pages/outdoor";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Catalog from "@/pages/catalog";
import Configurator from "@/pages/configurator";
import Search from "@/pages/search";
import Wishlist from "@/pages/wishlist";
import Favourites from "@/pages/favourites";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import Cart from "@/pages/cart";
import OrderTracking from "@/pages/order-tracking";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminDiscounts from "@/pages/admin/discounts";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSettings from "@/pages/admin/settings";
import AdminManufacturing from "@/pages/admin/manufacturing";
import AdminManufacturers from "@/pages/admin/manufacturers";
import AdminSupport from "@/pages/admin/support";
import ManufacturerDashboard from "@/pages/manufacturer/dashboard";
import ManufacturerProcesses from "@/pages/manufacturer/processes";
import ManufacturerProcessDetail from "@/pages/manufacturer/process-detail";
import ManufacturerNotifications from "@/pages/manufacturer/notifications";
import ManufacturerSupport from "@/pages/manufacturer/support";
import ManufacturerSettings from "@/pages/manufacturer/settings";
import ManufacturerRegistration from "@/pages/manufacturer-registration";
import ManufacturerLogin from "@/pages/manufacturer-login";
import AdminLogin from "@/pages/admin-login";
import Support from "@/pages/support";

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/users" component={AdminUsers} />
        <Route path="/products" component={AdminProducts} />
        <Route path="/orders" component={AdminOrders} />
        <Route path="/manufacturing" component={AdminManufacturing} />
        <Route path="/manufacturers" component={AdminManufacturers} />
        <Route path="/discounts" component={AdminDiscounts} />
        <Route path="/analytics" component={AdminAnalytics} />
        <Route path="/support" component={AdminSupport} />
        <Route path="/settings" component={AdminSettings} />
        <Route component={() => <div>Admin Page Not Found</div>} />
      </Switch>
    </AdminLayout>
  );
}

function ManufacturerRouter() {
  return (
    <ManufacturerLayout>
      <Switch>
        <Route path="/" component={ManufacturerDashboard} />
        <Route path="processes" component={ManufacturerProcesses} />
        <Route path="processes/:id" component={ManufacturerProcessDetail} />
        <Route path="notifications" component={ManufacturerNotifications} />
        <Route path="support" component={ManufacturerSupport} />
        <Route path="settings" component={ManufacturerSettings} />
        <Route component={() => <div>Manufacturer Page Not Found</div>} />
      </Switch>
    </ManufacturerLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin" nest component={AdminRouter} />
      <Route path="/manufacturer" nest component={ManufacturerRouter} />
      <Route path="/" component={Home} />
      <Route path="/product" component={Product} />
      <Route path="/new" component={New} />
      <Route path="/furniture" component={Furniture} />
      <Route path="/living-room" component={LivingRoom} />
      <Route path="/dining" component={Dining} />
      <Route path="/bedroom" component={Bedroom} />
      <Route path="/study" component={Study} />
      <Route path="/outdoor" component={Outdoor} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/manufacturer-registration" component={ManufacturerRegistration} />
      <Route path="/manufacturer-login" component={ManufacturerLogin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/configurator/:id" component={Configurator} />
      <Route path="/search" component={Search} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/favourites" component={Favourites} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:orderId/tracking" component={OrderTracking} />
      <Route path="/cart" component={Cart} />
      <Route path="/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin") && location !== "/admin-login";
  const isManufacturerRoute = location.startsWith("/manufacturer") && location !== "/manufacturer-login";

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          {!isAdminRoute && !isManufacturerRoute && <Navigation />}
          <Router />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
