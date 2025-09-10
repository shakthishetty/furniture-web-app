import { Button } from "@/components/ui/button";
import { User, Search, Heart, ShoppingBag } from "lucide-react";
import heroImage from "../assets/hero-bedroom.jpg";
import bedroomImage from "../assets/bedroom-category.jpg";
import livingRoomImage from "../assets/living-room-category.jpg";
import greenChairImage from "../assets/green-chair.jpg";
import redChairImage from "../assets/red-chair.jpg";
import woodenChairImage from "../assets/wooden-chair.jpg";

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
              <span className="text-xl font-bold text-white font-serif">TEAK THEORY</span>
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
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <h1 className="font-serif text-white mb-6" style={{ fontSize: '64px', lineHeight: '100%' }}>
            Designed to Be Passed Down,
            <br />
            <span className="italic font-light" style={{ fontSize: '56px', lineHeight: '100%' }}>Not Thrown Away</span>
          </h1>
          
          <div className="mt-12">
            <Button 
              className="bg-white text-black px-8 py-4 font-sans font-semibold rounded hover:bg-gray-100 transition-all duration-300"
              style={{ fontSize: '16px', lineHeight: '150%' }}
              data-testid="button-explore-collection"
            >
              Explore Collection
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
          {/* Bedroom Category */}
          <div 
            className="relative flex items-center justify-center h-full"
            style={{
              backgroundImage: `url(${bedroomImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 text-center text-white px-6">
              <h2 className="font-serif mb-4" style={{ fontSize: '48px', lineHeight: '100%' }}>Bedroom</h2>
              <p className="font-sans mb-6 opacity-90" style={{ fontSize: '16px', lineHeight: '150%' }}>Crafted sanctuaries for your most peaceful hours.</p>
              <a 
                href="#" 
                className="inline-block text-white underline hover:no-underline transition-all font-sans"
                style={{ fontSize: '16px', lineHeight: '150%' }}
                data-testid="link-bedroom-collection"
              >
                View Collection
              </a>
            </div>
          </div>

          {/* Living Room Category */}
          <div 
            className="relative flex items-center justify-center h-full"
            style={{
              backgroundImage: `url(${livingRoomImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 text-center text-white px-6">
              <h2 className="font-serif mb-4" style={{ fontSize: '48px', lineHeight: '100%' }}>Living Room</h2>
              <p className="font-sans mb-6 opacity-90" style={{ fontSize: '16px', lineHeight: '150%' }}>Crafted sanctuaries for your most peaceful hours.</p>
              <a 
                href="#" 
                className="inline-block text-white underline hover:no-underline transition-all font-sans"
                style={{ fontSize: '16px', lineHeight: '150%' }}
                data-testid="link-living-room-collection"
              >
                View Collection
              </a>
            </div>
          </div>
        </div>

        {/* Modern Tab */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
          <div className="text-white px-8 py-3 rounded-t-lg" style={{ backgroundColor: '#254127' }}>
            <span className="font-sans font-medium" style={{ fontSize: '16px', lineHeight: '150%' }}>Modern</span>
          </div>
        </div>
      </section>

      {/* Furniture Collection Showcase */}
      <section className="py-0 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
          {/* Left Column */}
          <div className="flex flex-col h-full">
            {/* Modern Collection - Top */}
            <div 
              className="relative h-2/3 overflow-hidden group"
              style={{
                backgroundImage: `url(${redChairImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Modern Overlay */}
              <div 
                className="absolute top-6 left-6 px-6 py-8 max-w-xs"
                style={{ backgroundColor: '#254127' }}
              >
                <h3 className="text-white font-serif mb-4" style={{ fontSize: '40px', lineHeight: '100%' }}>
                  Modern
                </h3>
                <p className="text-white font-sans mb-6" style={{ fontSize: '16px', lineHeight: '150%' }}>
                  The Modern Collection brings together graceful lines and luxurious finishes.
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center text-white font-sans hover:underline transition-all"
                  style={{ fontSize: '16px', lineHeight: '150%' }}
                  data-testid="link-modern-collection"
                >
                  View Collection
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Wood Collection - Bottom */}
            <div 
              className="relative h-1/3 overflow-hidden group"
              style={{
                backgroundImage: `url(${woodenChairImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Wood Overlay */}
              <div 
                className="absolute top-4 left-4 px-4 py-6 max-w-xs"
                style={{ backgroundColor: '#254127' }}
              >
                <h3 className="text-white font-serif mb-3" style={{ fontSize: '40px', lineHeight: '100%' }}>
                  Wood
                </h3>
                <p className="text-white font-sans mb-4" style={{ fontSize: '16px', lineHeight: '150%' }}>
                  The Modern Collection brings together graceful lines and luxurious finishes.
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center text-white font-sans hover:underline transition-all"
                  style={{ fontSize: '16px', lineHeight: '150%' }}
                  data-testid="link-wood-collection"
                >
                  View Collection
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Modern Collection */}
          <div 
            className="relative h-full overflow-hidden group"
            style={{
              backgroundImage: `url(${greenChairImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Modern Overlay - White */}
            <div 
              className="absolute bottom-6 left-6 bg-white px-6 py-8 max-w-xs"
            >
              <h3 className="font-serif mb-4" style={{ fontSize: '40px', lineHeight: '100%', color: '#000000' }}>
                Modern
              </h3>
              <p className="font-sans mb-6" style={{ fontSize: '16px', lineHeight: '150%', color: '#000000' }}>
                The Modern Collection brings together graceful lines and luxurious finishes.
              </p>
              <a 
                href="#" 
                className="inline-flex items-center font-sans hover:underline transition-all"
                style={{ fontSize: '16px', lineHeight: '150%', color: '#000000' }}
                data-testid="link-modern-collection-alt"
              >
                View Collection
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
