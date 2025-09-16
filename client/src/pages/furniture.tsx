import { Button } from "@/components/ui/button";
import { User, Search, Heart, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import productChairGreen from "../assets/product-chair-green.jpg";
import productChairRed from "../assets/product-chair-red.jpg";
import productChairWood from "../assets/product-chair-wood.jpg";

export default function Furniture() {
  const productImages = [productChairGreen, productChairRed, productChairWood];
  
  const products = [
    { id: 1, name: "STRATA TEAK DINING CHAIR", memberPrice: "$360", regularPrice: "$450", image: productImages[0], category: "Dining", colors: ["#8B4513", "#A0522D"] },
    { id: 2, name: "STRATA TEAK LOUNGE CHAIR", memberPrice: "$960", regularPrice: "$1,200", image: productImages[1], category: "Living Room", colors: ["#D2691E", "#DEB887"] },
    { id: 3, name: "STRATA TEAK COFFEE TABLE", memberPrice: "$680", regularPrice: "$850", image: productImages[2], category: "Living Room", colors: ["#8B4513", "#CD853F"] },
    { id: 4, name: "STRATA TEAK PLATFORM BED", memberPrice: "$1440", regularPrice: "$1,800", image: productImages[0], category: "Bedroom", colors: ["#A0522D", "#DEB887"] },
    { id: 5, name: "STRATA TEAK DESK", memberPrice: "$960", regularPrice: "$1,200", image: productImages[1], category: "Study", colors: ["#8B4513", "#D2691E"] },
    { id: 6, name: "STRATA TEAK OUTDOOR BENCH", memberPrice: "$520", regularPrice: "$650", image: productImages[2], category: "Outdoor", colors: ["#CD853F", "#A0522D"] },
    { id: 7, name: "STRATA TEAK SIDEBOARD", memberPrice: "$1280", regularPrice: "$1,600", image: productImages[0], category: "Dining", colors: ["#8B4513", "#DEB887"] },
    { id: 8, name: "STRATA TEAK WARDROBE", memberPrice: "$1920", regularPrice: "$2,400", image: productImages[1], category: "Bedroom", colors: ["#A0522D", "#CD853F"] },
    { id: 9, name: "STRATA TEAK BAR STOOL", memberPrice: "$256", regularPrice: "$320", image: productImages[2], category: "Dining", colors: ["#8B4513", "#D2691E"] }
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
              <Link href="/new" className="text-sm font-medium text-gray-600 hover:text-black" data-testid="nav-new">
                New
              </Link>
              <Link href="/furniture" className="text-sm font-medium text-black border-b-2 border-black" data-testid="nav-furniture">
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
          <h1 className="text-4xl font-bold font-serif mb-4" data-testid="page-title">All Furniture</h1>
          <p className="text-gray-600 text-lg" data-testid="page-description">
            Explore our complete collection of handcrafted teak furniture designed for modern living.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {products.map((product) => (
            <Link key={product.id} href="/product">
              <div className="cursor-pointer" data-testid={`product-${product.id}`}>
                <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-6">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Available in multiple finishes</p>
                  <h3 className="font-normal text-sm tracking-wide text-gray-800" data-testid={`product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600" data-testid={`product-price-${product.id}`}>
                    Starting at <span className="font-medium">{product.memberPrice} Member</span> / {product.regularPrice} Regular
                  </p>
                  <div className="flex justify-center space-x-2 mt-3">
                    {product.colors.map((color, index) => (
                      <div 
                        key={index}
                        className="w-4 h-4 rounded-full border border-gray-300"
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
  );
}