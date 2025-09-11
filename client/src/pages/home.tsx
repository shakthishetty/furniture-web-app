import { Button } from "@/components/ui/button";
import { User, Search, Heart, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/hooks/useCart";
import heroImage from "../assets/hero-bedroom.jpg";
import bedroomImage from "../assets/bedroom-category.jpg";
import livingRoomImage from "../assets/living-room-category.jpg";
import greenChairImage from "../assets/green-chair.jpg";
import redChairImage from "../assets/red-chair.jpg";
import woodenChairImage from "../assets/wooden-chair.jpg";
import livingRoomSceneImage from "../assets/living-room-scene.jpg";
import bedroomSceneImage from "../assets/bedroom-scene.jpg";
import chairSceneImage from "../assets/chair-scene.jpg";
import modernLivingRoomImage from "../assets/modern-living-room.jpg";
import centeredLivingRoomImage from "../assets/centered-living-room.jpg";

export default function Home() {
  const { getCartCount } = useCart();
  
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
              <Link href="/new" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-new">
                New
              </Link>
              <Link href="/catalog" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-catalog">
                Catalog
              </Link>
              <Link href="/living-room" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-living-room">
                Living Room
              </Link>
              <Link href="/dining" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-dining">
                Dining
              </Link>
              <Link href="/bedroom" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-bedroom">
                Bedroom
              </Link>
              <Link href="/study" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-study">
                Study
              </Link>
              <Link href="/outdoor" className="text-sm font-medium text-white/90 hover:text-white" data-testid="nav-outdoor">
                Outdoor
              </Link>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/10" data-testid="button-login">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline ml-2 text-sm">Login</span>
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/10" data-testid="button-search">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/wishlist">
                <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/10" data-testid="button-wishlist">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/10 relative" data-testid="button-cart">
                  <ShoppingBag className="h-5 w-5" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {getCartCount()}
                    </span>
                  )}
                </Button>
              </Link>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 h-screen border-8 border-white">
          {/* Left Column */}
          <div className="flex flex-col h-full border-r-4 border-white">
            {/* Modern Collection - Top */}
            <div 
              className="relative h-2/3 overflow-hidden border-b-4 border-white"
              style={{
                backgroundImage: `url(${redChairImage})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#f0f0f0'
              }}
            >
              {/* Modern Overlay */}
              <div 
                className="absolute top-8 left-8 px-5 py-6"
                style={{ 
                  backgroundColor: '#254127',
                  width: '280px',
                  height: '200px'
                }}
              >
                <h3 className="text-white font-serif mb-3" style={{ fontSize: '32px', lineHeight: '100%' }}>
                  Modern
                </h3>
                <p className="text-white font-sans mb-4" style={{ fontSize: '14px', lineHeight: '150%' }}>
                  The Modern Collection brings together graceful lines and luxurious finishes.
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center text-white font-sans hover:underline transition-all"
                  style={{ fontSize: '14px', lineHeight: '150%' }}
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
              className="relative h-1/3 overflow-hidden"
              style={{
                backgroundImage: `url(${woodenChairImage})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: '#f0f0f0'
              }}
            >
              {/* Wood Overlay */}
              <div 
                className="absolute top-4 left-4 px-4 py-4"
                style={{ 
                  backgroundColor: '#254127',
                  width: '200px',
                  height: '140px'
                }}
              >
                <h3 className="text-white font-serif mb-2" style={{ fontSize: '28px', lineHeight: '100%' }}>
                  Wood
                </h3>
                <p className="text-white font-sans mb-3" style={{ fontSize: '12px', lineHeight: '150%' }}>
                  The Modern Collection brings together graceful lines and luxurious finishes.
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center text-white font-sans hover:underline transition-all"
                  style={{ fontSize: '12px', lineHeight: '150%' }}
                  data-testid="link-wood-collection"
                >
                  View Collection
                  <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Modern Collection */}
          <div 
            className="relative h-full overflow-hidden"
            style={{
              backgroundImage: `url(${greenChairImage})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#f0f0f0'
            }}
          >
            {/* Modern Overlay - White */}
            <div 
              className="absolute bottom-8 left-8 bg-white px-5 py-6"
              style={{ 
                width: '280px',
                height: '200px'
              }}
            >
              <h3 className="font-serif mb-3" style={{ fontSize: '32px', lineHeight: '100%', color: '#000000' }}>
                Modern
              </h3>
              <p className="font-sans mb-4" style={{ fontSize: '14px', lineHeight: '150%', color: '#000000' }}>
                The Modern Collection brings together graceful lines and luxurious finishes.
              </p>
              <a 
                href="#" 
                className="inline-flex items-center font-sans hover:underline transition-all"
                style={{ fontSize: '14px', lineHeight: '150%', color: '#000000' }}
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

      {/* Durability Section */}
      <section className="py-0 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
          {/* Left Side - Living Room Scene */}
          <div 
            className="relative h-full overflow-hidden"
            style={{
              backgroundImage: `url(${livingRoomSceneImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
          </div>

          {/* Right Side - Green Text Area */}
          <div 
            className="relative h-full flex items-center justify-center px-16"
            style={{ backgroundColor: '#254127' }}
          >
            <div className="text-center text-white max-w-lg">
              <h2 className="font-serif mb-2" style={{ fontSize: '56px', lineHeight: '100%' }}>
                Designed for durability,
              </h2>
              <h3 className="font-serif italic mb-8" style={{ fontSize: '48px', lineHeight: '100%' }}>
                Made for rest.
              </h3>
              <p className="font-sans mb-12" style={{ fontSize: '16px', lineHeight: '150%' }}>
                Built with solid teak and timeless joinery, our bedroom collection is made to last through years 
                of daily use without compromising on comfort. From beds to side tables, every piece is 
                thoughtfully designed to support restful living, day after day.
              </p>
              <Button 
                className="bg-transparent border-2 border-white text-white px-8 py-3 font-sans hover:bg-white hover:text-black transition-all duration-300"
                style={{ fontSize: '16px', lineHeight: '150%' }}
                data-testid="button-explore-collection-durability"
              >
                Explore Collection
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Nature Section */}
      <section className="py-0 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
          {/* Left Side - Green Text Area */}
          <div 
            className="relative h-full flex items-center justify-center px-16"
            style={{ backgroundColor: '#254127' }}
          >
            <div className="text-left text-white max-w-lg">
              <h2 className="font-serif mb-2" style={{ fontSize: '56px', lineHeight: '100%' }}>
                Rooted in nature.
              </h2>
              <h3 className="font-serif italic mb-8" style={{ fontSize: '48px', lineHeight: '100%' }}>
                Designed for quiet moments.
              </h3>
              <p className="font-sans mb-12" style={{ fontSize: '16px', lineHeight: '150%' }}>
                Crafted from sustainably sourced teak, our bedroom pieces bring the quiet elegance of 
                nature into your home. With clean lines, warm tones, and thoughtful details, each piece is 
                made to turn your space into a restful retreat that ages beautifully with time.
              </p>
              <Button 
                className="bg-transparent border-2 border-white text-white px-8 py-3 font-sans hover:bg-white hover:text-black transition-all duration-300"
                style={{ fontSize: '16px', lineHeight: '150%' }}
                data-testid="button-explore-collection-nature"
              >
                Explore Collection
              </Button>
            </div>
          </div>

          {/* Right Side - Bedroom Scene */}
          <div 
            className="relative h-full overflow-hidden"
            style={{
              backgroundImage: `url(${bedroomSceneImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
          </div>
        </div>
      </section>

      {/* Chair Scene Section */}
      <section className="py-0 bg-white">
        <div 
          className="relative h-screen overflow-hidden"
          style={{
            backgroundImage: `url(${chairSceneImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Text Overlay - Top Left */}
          <div className="absolute top-12 left-12">
            <div className="text-left text-white max-w-md">
              <h2 className="font-serif mb-2" style={{ fontSize: '56px', lineHeight: '100%' }}>
                Rooted in nature.
              </h2>
              <h3 className="font-serif italic mb-8" style={{ fontSize: '48px', lineHeight: '100%' }}>
                Designed for quiet moments.
              </h3>
              <Button 
                className="bg-transparent border-2 border-white text-white px-8 py-3 font-sans hover:bg-white hover:text-black transition-all duration-300"
                style={{ fontSize: '16px', lineHeight: '150%' }}
                data-testid="button-explore-collection-chair"
              >
                Explore Collection
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Living Room Section */}
      <section className="py-0 bg-white">
        <div 
          className="relative h-screen overflow-hidden"
          style={{
            backgroundImage: `url(${modernLivingRoomImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Text Overlay - Bottom Left */}
          <div className="absolute bottom-12 left-12">
            <div className="text-left text-white max-w-md">
              <h2 className="font-serif mb-2" style={{ fontSize: '56px', lineHeight: '100%' }}>
                Rooted in nature.
              </h2>
              <h3 className="font-serif italic mb-8" style={{ fontSize: '48px', lineHeight: '100%' }}>
                Designed for quiet moments.
              </h3>
              <Button 
                className="bg-transparent border-2 border-white text-white px-8 py-3 font-sans hover:bg-white hover:text-black transition-all duration-300"
                style={{ fontSize: '16px', lineHeight: '150%' }}
                data-testid="button-explore-collection-modern-living"
              >
                Explore Collection
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Centered Living Room Section */}
      <section className="py-0 bg-white">
        <div 
          className="relative h-screen overflow-hidden"
          style={{
            backgroundImage: `url(${centeredLivingRoomImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Text Overlay - Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-md">
              <h2 className="font-serif mb-2" style={{ fontSize: '56px', lineHeight: '100%' }}>
                Rooted in nature.
              </h2>
              <h3 className="font-serif italic mb-8" style={{ fontSize: '48px', lineHeight: '100%' }}>
                Designed for quiet moments.
              </h3>
              <Button 
                className="bg-transparent border-2 border-white text-white px-8 py-3 font-sans hover:bg-white hover:text-black transition-all duration-300"
                style={{ fontSize: '16px', lineHeight: '150%' }}
                data-testid="button-explore-collection-centered"
              >
                Explore Collection
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Features */}
      <section 
        className="border-t-8 border-white"
        style={{ backgroundColor: '#254127' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 text-center text-white">
          <div className="flex items-center justify-center gap-3 py-4 border-r-2 border-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7L12 3L4 7L12 11L20 7Z" />
              <path d="M4 12L12 16L20 12" />
            </svg>
            <span className="font-sans text-sm">Free Shipping over $500</span>
          </div>
          <div className="flex items-center justify-center gap-3 py-4 border-r-2 border-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12L11 14L15 10" />
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" />
            </svg>
            <span className="font-sans text-sm">5 Year Warranty</span>
          </div>
          <div className="flex items-center justify-center gap-3 py-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12H22" />
              <path d="M12 2A15.3 15.3 0 0 1 16 12A15.3 15.3 0 0 1 12 22A15.3 15.3 0 0 1 8 12A15.3 15.3 0 0 1 12 2Z" />
            </svg>
            <span className="font-sans text-sm">Worldwide Shipping</span>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <section 
        className="border-t-2 border-white"
        style={{ backgroundColor: '#254127' }}
      >
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 text-white">
            {/* Logo */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="currentColor">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"/>
                  <path d="M30 35 L50 25 L70 35 L70 45 L50 35 L30 45 Z" fill="currentColor"/>
                  <path d="M30 50 L50 40 L70 50 L70 60 L50 50 L30 60 Z" fill="currentColor"/>
                  <path d="M30 65 L50 55 L70 65 L70 75 L50 65 L30 75 Z" fill="currentColor"/>
                </svg>
                <span className="font-serif text-xl">TEAK THEORY</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-sans font-medium mb-4 text-sm">Quick links</h4>
              <ul className="space-y-2 text-sm font-sans">
                <li><a href="#" className="hover:underline">Home</a></li>
                <li><a href="#" className="hover:underline">About us</a></li>
                <li><a href="#" className="hover:underline">Why choose us</a></li>
                <li><a href="#" className="hover:underline">Contact us</a></li>
              </ul>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-sans font-medium mb-4 text-sm">Shop</h4>
              <ul className="space-y-2 text-sm font-sans">
                <li><a href="#" className="hover:underline">Furniture</a></li>
                <li><a href="#" className="hover:underline">Collections</a></li>
                <li><a href="#" className="hover:underline">Bedroom</a></li>
                <li><a href="#" className="hover:underline">Outdoor</a></li>
              </ul>
            </div>

            {/* Terms */}
            <div>
              <h4 className="font-sans font-medium mb-4 text-sm">Terms and Conditions</h4>
              <ul className="space-y-2 text-sm font-sans">
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Return Policy</a></li>
                <li><a href="#" className="hover:underline">Shopping Policy</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-sans font-medium mb-4 text-sm">Join our newsletter and get 20% off your first purchase</h4>
              <div className="space-y-4">
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder="name@gmail.com"
                    className="flex-1 px-3 py-2 text-black text-sm"
                    data-testid="input-newsletter-email"
                  />
                  <Button 
                    className="bg-white text-black px-6 py-2 text-sm font-sans hover:bg-gray-100"
                    data-testid="button-subscribe"
                  >
                    Subscribe
                  </Button>
                </div>
                <div>
                  <p className="text-xs font-sans mb-2">Social Media</p>
                  <p className="text-xs font-sans">Instagram / Facebook / LinkedIn</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div 
          className="border-t-2 border-white py-4"
          style={{ backgroundColor: '#254127' }}
        >
          <div className="max-w-6xl mx-auto px-8 flex justify-between items-center text-white text-xs font-sans">
            <span>© 2025 Teak Theory.</span>
            <div className="flex items-center gap-6">
              <Link 
                href="/admin" 
                className="text-white hover:underline font-medium"
                data-testid="link-admin"
              >
                ADMIN
              </Link>
              <Link 
                href="/manufacturer" 
                className="text-white hover:underline font-medium"
                data-testid="link-manufacturer"
              >
                MANUFACTURER
              </Link>
              <span>Designed by Wisdom Tooth Technologies</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
