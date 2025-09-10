import { Button } from "@/components/ui/button";
import { User, Search, Heart, ShoppingBag, X } from "lucide-react";
import { Link } from "wouter";
import productChairGreen from "../assets/product-chair-green.jpg";
import productChairRed from "../assets/product-chair-red.jpg";
import productChairWood from "../assets/product-chair-wood.jpg";

export default function Wishlist() {
  const productImages = [productChairGreen, productChairRed, productChairWood];
  
  const wishlistItems = [
    { id: 1, name: "Modern Lounge Chair", price: "$1,200", image: productImages[0], category: "Living Room" },
    { id: 2, name: "Dining Table", price: "$2,800", image: productImages[1], category: "Dining" },
    { id: 3, name: "Teak Nightstand", price: "$650", image: productImages[2], category: "Bedroom" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer" data-testid="logo">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="currentColor">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3"/>
                  <path d="M30 35 L50 25 L70 35 L70 45 L50 35 L30 45 Z" fill="currentColor"/>
                  <path d="M30 50 L50 40 L70 50 L70 60 L50 50 L30 60 Z" fill="currentColor"/>
                  <path d="M30 65 L50 55 L70 65 L70 75 L50 65 L30 75 Z" fill="currentColor"/>
                </svg>
                <span className="text-xl font-bold text-black font-serif">TEAK THEORY</span>
              </div>
            </Link>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/new" className="text-sm font-medium text-gray-600 hover:text-black" data-testid="nav-new">
                New
              </Link>
              <Link href="/furniture" className="text-sm font-medium text-gray-600 hover:text-black" data-testid="nav-furniture">
                Furniture
              </Link>
              <Link href="/living-room" className="text-sm font-medium text-gray-600 hover:text-black" data-testid="nav-living-room">
                Living Room
              </Link>
              <Link href="/dining" className="text-sm font-medium text-gray-600 hover:text-black" data-testid="nav-dining">
                Dining
              </Link>
              <Link href="/bedroom" className="text-sm font-medium text-gray-600 hover:text-black" data-testid="nav-bedroom">
                Bedroom
              </Link>
              <Link href="/study" className="text-sm font-medium text-gray-600 hover:text-black" data-testid="nav-study">
                Study
              </Link>
              <Link href="/outdoor" className="text-sm font-medium text-gray-600 hover:text-black" data-testid="nav-outdoor">
                Outdoor
              </Link>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100" data-testid="button-login">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline ml-2 text-sm">Login</span>
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100" data-testid="button-search">
                  <Search className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="p-2 text-black bg-gray-100" data-testid="button-wishlist">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100" data-testid="button-cart">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-serif mb-4" data-testid="page-title">My Wishlist</h1>
          <p className="text-gray-600 text-lg" data-testid="page-description">
            Save your favorite pieces for later and never lose track of what you love.
          </p>
        </div>

        {/* Wishlist Items */}
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistItems.map((item) => (
              <div key={item.id} className="group relative" data-testid={`wishlist-item-${item.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                  data-testid={`remove-wishlist-${item.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <Link href="/product">
                  <div className="cursor-pointer">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg group-hover:text-gray-600 transition-colors" data-testid={`product-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500" data-testid={`product-category-${item.id}`}>{item.category}</p>
                      <p className="font-semibold text-lg" data-testid={`product-price-${item.id}`}>{item.price}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-8">Start exploring our collections to find pieces you love</p>
            <Link href="/new">
              <Button 
                className="px-8 py-3 text-white font-medium"
                style={{ backgroundColor: '#254127' }}
                data-testid="browse-products-button"
              >
                Browse Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}