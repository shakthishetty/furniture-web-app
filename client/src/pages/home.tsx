import { Button } from "@/components/ui/button";
import { User, Search, Heart, ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2" data-testid="logo">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-primary rounded-full"></div>
              </div>
              <span className="text-xl font-bold text-white">TEAK THEORY</span>
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-new">
                New
              </a>
              <a href="#" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-furniture">
                Furniture
              </a>
              <a href="#" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-living-room">
                Living Room
              </a>
              <a href="#" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-dining">
                Dining
              </a>
              <a href="#" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-bedroom">
                Bedroom
              </a>
              <a href="#" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-study">
                Study
              </a>
              <a href="#" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-outdoor">
                Outdoor
              </a>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/10" data-testid="button-login">
                <User className="h-5 w-5" />
                <span className="hidden md:inline ml-2 text-sm">Login</span>
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/10" data-testid="button-search">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/10" data-testid="button-wishlist">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/10" data-testid="button-cart">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url("@assets/Rectangle 2 (1)_1757489905307.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 leading-tight">
            Designed to Be Passed Down,
            <br />
            <span className="italic font-light text-4xl md:text-6xl">Not Thrown Away</span>
          </h1>
          
          <div className="mt-12">
            <Button 
              className="bg-white text-black px-8 py-4 text-lg font-semibold rounded hover:bg-gray-100 transition-all duration-300"
              data-testid="button-explore-collection"
            >
              Explore Collection
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
