import { Button } from "@/components/ui/button";
import { User, Search, Heart, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import productChairGreen from "../assets/product-chair-green.jpg";
import productChairRed from "../assets/product-chair-red.jpg";
import productChairWood from "../assets/product-chair-wood.jpg";

export default function Outdoor() {
  const productImages = [productChairGreen, productChairRed, productChairWood];
  
  const products = [
    { id: 1, name: "Outdoor Dining Set", price: "$2,200", image: productImages[1], category: "Dining" },
    { id: 2, name: "Lounge Chair", price: "$850", image: productImages[0], category: "Seating" },
    { id: 3, name: "Garden Bench", price: "$650", image: productImages[2], category: "Seating" },
    { id: 4, name: "Outdoor Sofa", price: "$1,800", image: productImages[1], category: "Seating" },
    { id: 5, name: "Side Table", price: "$320", image: productImages[0], category: "Tables" },
    { id: 6, name: "Umbrella Stand", price: "$180", image: productImages[2], category: "Accessories" }
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
              <Link href="/outdoor" className="text-sm font-medium text-black border-b-2 border-black" data-testid="nav-outdoor">
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
              <Link href="/wishlist">
                <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100" data-testid="button-wishlist">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
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
          <h1 className="text-4xl font-bold font-serif mb-4" data-testid="page-title">Outdoor Living</h1>
          <p className="text-gray-600 text-lg" data-testid="page-description">
            Extend your living space outdoors with our weather-resistant teak furniture collection.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link key={product.id} href="/product">
              <div className="group cursor-pointer" data-testid={`product-${product.id}`}>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-lg group-hover:text-gray-600 transition-colors" data-testid={`product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <Button variant="ghost" size="sm" className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500" data-testid={`product-category-${product.id}`}>{product.category}</p>
                  <p className="font-semibold text-lg" data-testid={`product-price-${product.id}`}>{product.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}