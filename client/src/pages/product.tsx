import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Search, Heart, ShoppingBag, Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import productChairImage from "../assets/product-chair.jpg";

export default function Product() {
  const [selectedFabric, setSelectedFabric] = useState("Dune");
  const [selectedWood, setSelectedWood] = useState("Natural");
  const [quantity, setQuantity] = useState(1);

  const fabricOptions = [
    { name: "Dune", color: "#D4C4A8", selected: selectedFabric === "Dune" },
    { name: "Dark", color: "#8B7355", selected: selectedFabric === "Dark" },
    { name: "Pearl", color: "#E8D5C4", selected: selectedFabric === "Pearl" },
    { name: "Concrete", color: "#A8A8A8", selected: selectedFabric === "Concrete" }
  ];

  const woodOptions = [
    { name: "Dark Brown", color: "#8B4513", selected: selectedWood === "Dark Brown" },
    { name: "Natural", color: "#DEB887", selected: selectedWood === "Natural" },
    { name: "Pearl", color: "#F5DEB3", selected: selectedWood === "Pearl" },
    { name: "Concrete", color: "#A8A8A8", selected: selectedWood === "Concrete" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <Logo variant="dark" data-testid="logo" />
            </Link>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm font-medium text-black hover:text-gray-600" data-testid="nav-new">
                New
              </a>
              <a href="#" className="text-sm font-medium text-black hover:text-gray-600" data-testid="nav-furniture">
                Furniture
              </a>
              <a href="#" className="text-sm font-medium text-black hover:text-gray-600" data-testid="nav-living-room">
                Living Room
              </a>
              <a href="#" className="text-sm font-medium text-black hover:text-gray-600" data-testid="nav-dining">
                Dining
              </a>
              <a href="#" className="text-sm font-medium text-black hover:text-gray-600" data-testid="nav-bedroom">
                Bedroom
              </a>
              <a href="#" className="text-sm font-medium text-black hover:text-gray-600" data-testid="nav-study">
                Study
              </a>
              <a href="#" className="text-sm font-medium text-black hover:text-gray-600" data-testid="nav-outdoor">
                Outdoor
              </a>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100" data-testid="button-login">
                <User className="h-5 w-5" />
                <span className="hidden md:inline ml-2 text-sm">Login</span>
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100" data-testid="button-search">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100" data-testid="button-wishlist">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100" data-testid="button-cart">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Product Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={productChairImage} 
                alt="Modern Teak Chair" 
                className="w-full h-full object-cover"
                data-testid="product-image"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                data-testid="button-favorite"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold font-serif mb-4" data-testid="product-name">
                Product Name
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl font-bold text-black" data-testid="current-price">
                  $5,500
                </span>
                <span className="text-lg text-gray-500 line-through" data-testid="original-price">
                  $6,000
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded" data-testid="discount-badge">
                  10% Off
                </span>
              </div>
              <p className="text-sm text-green-600 mb-4" data-testid="tax-info">
                Price inclusive of all taxes
              </p>
              <p className="text-gray-600 text-sm leading-relaxed" data-testid="product-description">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros 
                elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo 
                diam libero vitae erat.
              </p>
            </div>

            {/* Fabric Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3" data-testid="fabric-label">
                FABRIC - {selectedFabric}
              </h3>
              <div className="flex gap-3">
                {fabricOptions.map((fabric) => (
                  <button
                    key={fabric.name}
                    onClick={() => setSelectedFabric(fabric.name)}
                    className={`w-12 h-12 rounded-lg border-2 ${
                      fabric.selected ? 'border-black' : 'border-gray-300'
                    } relative`}
                    style={{ backgroundColor: fabric.color }}
                    data-testid={`fabric-${fabric.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs text-gray-600">{fabric.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wood Selection */}
            <div className="pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3" data-testid="wood-label">
                WOOD ACCENTS - {selectedWood}
              </h3>
              <div className="flex gap-3">
                {woodOptions.map((wood) => (
                  <button
                    key={wood.name}
                    onClick={() => setSelectedWood(wood.name)}
                    className={`w-12 h-12 rounded-lg border-2 ${
                      wood.selected ? 'border-black' : 'border-gray-300'
                    } relative`}
                    style={{ backgroundColor: wood.color }}
                    data-testid={`wood-${wood.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                      <span className="text-xs text-gray-600">{wood.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3" data-testid="quantity-label">
                  Quantity
                </h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 p-0"
                    data-testid="quantity-decrease"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium w-8 text-center" data-testid="quantity-value">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 p-0"
                    data-testid="quantity-increase"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                className="w-full py-3 text-white font-medium"
                style={{ backgroundColor: '#254127' }}
                data-testid="add-to-cart-button"
              >
                Add To Cart - $5,500
              </Button>

              <p className="text-sm text-gray-600 text-center" data-testid="shipping-info">
                Free shipping over $50
              </p>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span data-testid="dispatch-date">Expected Dispatch Date - 25 Aug 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}