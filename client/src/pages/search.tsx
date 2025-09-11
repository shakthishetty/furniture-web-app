import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Search as SearchIcon, Heart, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import productChairGreen from "../assets/product-chair-green.jpg";
import productChairRed from "../assets/product-chair-red.jpg";
import productChairWood from "../assets/product-chair-wood.jpg";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const productImages = [productChairGreen, productChairRed, productChairWood];
  
  const searchResults = [
    { id: 1, name: "STRATA TEAK DINING CHAIR", memberPrice: "$360", regularPrice: "$450", image: productImages[0], category: "Dining", colors: ["#8B4513", "#A0522D"] },
    { id: 2, name: "STRATA TEAK COFFEE TABLE", memberPrice: "$680", regularPrice: "$850", image: productImages[1], category: "Living Room", colors: ["#D2691E", "#DEB887"] },
    { id: 3, name: "STRATA TEAK PLATFORM BED", memberPrice: "$1440", regularPrice: "$1,800", image: productImages[2], category: "Bedroom", colors: ["#8B4513", "#CD853F"] },
    { id: 4, name: "STRATA TEAK OFFICE DESK", memberPrice: "$960", regularPrice: "$1,200", image: productImages[0], category: "Study", colors: ["#A0522D", "#DEB887"] }
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
              <Button variant="ghost" size="sm" className="p-2 text-black bg-gray-100" data-testid="button-search">
                <SearchIcon className="h-5 w-5" />
              </Button>
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
        {/* Search Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-serif mb-8" data-testid="page-title">Search</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Input
              type="text"
              placeholder="Search for furniture, categories, or collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 py-3 text-lg"
              data-testid="search-input"
            />
            <Button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
              style={{ backgroundColor: '#254127' }}
              data-testid="search-button"
            >
              <SearchIcon className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Search Results */}
        <div>
          <h2 className="text-2xl font-semibold font-serif mb-6" data-testid="results-title">
            {searchQuery ? `Results for "${searchQuery}"` : "Popular Items"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {searchResults.map((product) => (
              <Link key={product.id} href="/product">
                <div className="cursor-pointer" data-testid={`search-result-${product.id}`}>
                  <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Available in multiple finishes</p>
                    <h3 className="font-normal text-sm tracking-wide text-gray-800" data-testid={`product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600" data-testid={`product-price-${product.id}`}>
                      Starting at <span className="font-medium">{product.memberPrice} Member</span> / {product.regularPrice} Regular
                    </p>
                    <div className="flex justify-center space-x-2 mt-2">
                      {product.colors.map((color, index) => (
                        <div 
                          key={index}
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}