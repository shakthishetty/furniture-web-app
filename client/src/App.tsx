import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/useCart";
import Navigation from "@/components/navigation";
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

function Router() {
  return (
    <Switch>
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
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/configurator/:id" component={Configurator} />
      <Route path="/search" component={Search} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/favourites" component={Favourites} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/cart" component={Cart} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Navigation />
          <Router />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
