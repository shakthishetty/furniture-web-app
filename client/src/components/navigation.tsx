import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Search, 
  Heart, 
  ShoppingBag, 
  Menu,
  X,
  Package,
  Truck,
  RotateCcw,
  HeadphonesIcon,
  Settings,
  FileText,
  MapPin,
  CreditCard
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import Logo from "@/components/Logo";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <Logo variant="dark" data-testid="logo" />
          </Link>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/new" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-new"
            >
              New
            </Link>
            <Link 
              href="/furniture" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-furniture"
            >
              Furniture
            </Link>
            <Link 
              href="/living-room" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-living-room"
            >
              Living Room
            </Link>
            <Link 
              href="/dining" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-dining"
            >
              Dining
            </Link>
            <Link 
              href="/bedroom" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-bedroom"
            >
              Bedroom
            </Link>
            <Link 
              href="/study" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-study"
            >
              Study
            </Link>
            <Link 
              href="/outdoor" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-outdoor"
            >
              Outdoor
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Orders Button - Always visible */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              data-testid="desktop-orders"
              asChild
            >
              <Link href="/orders">
                <Package className="h-4 w-4" />
                <span className="ml-2 text-sm">Orders</span>
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              data-testid="button-login"
            >
              <User className="h-5 w-5" />
              <span className="hidden md:inline ml-2 text-sm">Login</span>
            </Button>
            <Link href="/search">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-search"
              >
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/wishlist">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-wishlist"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-muted-foreground hover:text-primary transition-colors relative"
                data-testid="button-cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Burger Menu Button - Now visible on all screen sizes */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-muted-foreground hover:text-primary"
              data-testid="button-mobile-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Menu Overlay - Now visible on all screen sizes */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-[73px] bg-background z-40 overflow-y-auto border-t border-border">
            <div className="px-6 py-6 space-y-6">
              
              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-order-history">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Order History</span>
                    <Badge variant="secondary" className="ml-auto">3</Badge>
                  </Link>
                  
                  <Link href="/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-track-order">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Track Delivery</span>
                    <Badge variant="outline" className="ml-auto">Live</Badge>
                  </Link>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" data-testid="mobile-cancel-order">
                    <RotateCcw className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Cancel/Return Order</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" data-testid="mobile-support">
                    <HeadphonesIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Customer Support</span>
                    <Badge variant="destructive" className="ml-auto">24/7</Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Account */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" data-testid="mobile-profile">
                    <User className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">My Profile</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" data-testid="mobile-addresses">
                    <MapPin className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium">Addresses</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" data-testid="mobile-payment">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Payment Methods</span>
                  </div>
                  
                  <Link href="/wishlist" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-wishlist">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="text-sm font-medium">Wishlist</span>
                  </Link>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" data-testid="mobile-settings">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium">Settings</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Shop Categories</h3>
                <div className="space-y-2">
                  <Link href="/new" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-nav-new">
                    <span className="text-sm font-medium">New Arrivals</span>
                  </Link>
                  <Link href="/furniture" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-nav-furniture">
                    <span className="text-sm font-medium">All Furniture</span>
                  </Link>
                  <Link href="/living-room" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-nav-living">
                    <span className="text-sm font-medium">Living Room</span>
                  </Link>
                  <Link href="/dining" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-nav-dining">
                    <span className="text-sm font-medium">Dining Room</span>
                  </Link>
                  <Link href="/bedroom" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-nav-bedroom">
                    <span className="text-sm font-medium">Bedroom</span>
                  </Link>
                  <Link href="/study" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-nav-study">
                    <span className="text-sm font-medium">Study & Office</span>
                  </Link>
                  <Link href="/outdoor" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-nav-outdoor">
                    <span className="text-sm font-medium">Outdoor</span>
                  </Link>
                </div>
              </div>
              
              <Separator />
              
              {/* Cart & Search */}
              <div className="space-y-2">
                <Link href="/cart" className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" data-testid="mobile-cart">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Shopping Cart</span>
                  {cartCount > 0 && (
                    <Badge className="ml-auto">{cartCount}</Badge>
                  )}
                </Link>
                
                <Link href="/search" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" data-testid="mobile-search">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Search Products</span>
                </Link>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
