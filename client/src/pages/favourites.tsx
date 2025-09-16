import { Button } from "@/components/ui/button";
import { User, Search, Heart, ShoppingBag, X } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/Logo";
import productChairGreen from "../assets/product-chair-green.jpg";
import productChairRed from "../assets/product-chair-red.jpg";
import productChairWood from "../assets/product-chair-wood.jpg";

export default function Favourites() {
  const productImages = [productChairGreen, productChairRed, productChairWood];
  
  const favouriteItems = [
    { id: 1, name: "STRATA TEAK ARMCHAIR", memberPrice: "$1160", regularPrice: "$1,450", image: productImages[0], category: "Living Room", colors: ["#8B4513", "#A0522D"] },
    { id: 2, name: "STRATA TEAK DINING SET", memberPrice: "$2560", regularPrice: "$3,200", image: productImages[1], category: "Dining", colors: ["#D2691E", "#DEB887"] },
    { id: 3, name: "STRATA TEAK PLATFORM BED", memberPrice: "$1680", regularPrice: "$2,100", image: productImages[2], category: "Bedroom", colors: ["#8B4513", "#CD853F"] },
    { id: 4, name: "STRATA TEAK EXECUTIVE DESK", memberPrice: "$1440", regularPrice: "$1,800", image: productImages[0], category: "Study", colors: ["#A0522D", "#DEB887"] }
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
              <Link href="/favourites">
                <Button variant="ghost" size="sm" className="p-2 text-black bg-gray-100" data-testid="button-favourites">
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
          <h1 className="text-4xl font-bold font-serif mb-4" data-testid="page-title">My Favourites</h1>
          <p className="text-gray-600 text-lg" data-testid="page-description">
            Your carefully curated collection of favorite furniture pieces.
          </p>
        </div>

        {/* Favourite Items */}
        {favouriteItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {favouriteItems.map((item) => (
              <div key={item.id} className="relative" data-testid={`favourite-item-${item.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                  data-testid={`remove-favourite-${item.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <Link href="/product">
                  <div className="cursor-pointer">
                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-4">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Available in multiple finishes</p>
                      <h3 className="font-normal text-sm tracking-wide text-gray-800" data-testid={`product-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600" data-testid={`product-price-${item.id}`}>
                        Starting at <span className="font-medium">{item.memberPrice} Member</span> / {item.regularPrice} Regular
                      </p>
                      <div className="flex justify-center space-x-2 mt-2">
                        {item.colors.map((color, index) => (
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No favourites yet</h3>
            <p className="text-gray-600 mb-8">Discover beautiful furniture pieces and mark your favorites</p>
            <Link href="/furniture">
              <Button 
                className="px-8 py-3 text-white font-medium"
                style={{ backgroundColor: '#254127' }}
                data-testid="browse-furniture-button"
              >
                Browse Furniture
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}