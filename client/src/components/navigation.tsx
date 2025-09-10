import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Search, 
  Heart, 
  ShoppingBag, 
  Menu,
  TreePine
} from "lucide-react";

export default function Navigation() {
  const [cartCount] = useState(0);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2" data-testid="logo">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <TreePine className="text-primary-foreground text-sm" />
            </div>
            <span className="text-xl font-bold text-foreground">TEAK THEORY</span>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-new"
            >
              New
            </a>
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-furniture"
            >
              Furniture
            </a>
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-living-room"
            >
              Living Room
            </a>
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-dining"
            >
              Dining
            </a>
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-bedroom"
            >
              Bedroom
            </a>
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-study"
            >
              Study
            </a>
            <a 
              href="#" 
              className="nav-link text-sm font-medium text-muted-foreground hover:text-primary" 
              data-testid="nav-outdoor"
            >
              Outdoor
            </a>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              data-testid="button-login"
            >
              <User className="h-5 w-5" />
              <span className="hidden md:inline ml-2 text-sm">Login</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              data-testid="button-search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              data-testid="button-wishlist"
            >
              <Heart className="h-5 w-5" />
            </Button>
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

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden p-2 text-muted-foreground hover:text-primary"
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
