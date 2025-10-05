import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { User, Search, Heart, ShoppingBag, Filter, Grid, List, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

export default function Catalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<string>("name");
  const { addToCart, getCartCount } = useCart();
  const { isInWishlist, toggleWishlist, isPending, getWishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.basePrice),
      imageUrl: product.imageUrl,
    });
    
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  // Fetch products from API
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['/api/configurator/products', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory !== "all" 
        ? `/api/configurator/products?category=${selectedCategory}`
        : '/api/configurator/products';
      const response = await fetch(url);
      return await response.json();
    },
  });

  const products = (productsData as any)?.products || [];
  const categories = ['all', 'living-room', 'dining', 'bedroom', 'study', 'outdoor'];

  // Filter and sort products
  const filteredProducts = products
    .filter((product: any) => selectedCategory === "all" || product.category === selectedCategory)
    .sort((a: any, b: any) => {
      if (sortBy === 'price') return parseFloat(a.basePrice) - parseFloat(b.basePrice);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

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
              <Link href="/catalog" className="text-sm font-medium text-black border-b-2 border-black" data-testid="nav-catalog">
                Catalog
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
                <Button variant="ghost" size="sm" className="p-2 text-black hover:bg-gray-100" data-testid="button-login">
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
                <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100 relative" data-testid="button-wishlist">
                  <Heart className="h-5 w-5" />
                  {getWishlistCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getWishlistCount()}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="p-2 text-black hover:text-gray-600 hover:bg-gray-100 relative" data-testid="button-cart">
                  <ShoppingBag className="h-5 w-5" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#254127] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-center mb-4">Product Catalog</h1>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
            Discover our complete collection of customizable teak furniture. Each piece can be tailored to your exact specifications.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Category Filter */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full md:w-auto">
                <TabsTrigger value="all" data-testid="filter-all">All</TabsTrigger>
                <TabsTrigger value="living-room" data-testid="filter-living-room">Living</TabsTrigger>
                <TabsTrigger value="dining" data-testid="filter-dining">Dining</TabsTrigger>
                <TabsTrigger value="bedroom" data-testid="filter-bedroom">Bedroom</TabsTrigger>
                <TabsTrigger value="study" data-testid="filter-study">Study</TabsTrigger>
                <TabsTrigger value="outdoor" data-testid="filter-outdoor">Outdoor</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="view-grid"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                  <div className="h-6 bg-gray-200 animate-pulse rounded mb-4" />
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product: any) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`product-card-${product.id}`}>
                <div className="aspect-square bg-gray-100 relative group">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {product.isCustomizable && (
                    <Badge className="absolute top-4 left-4 bg-[#254127]" data-testid={`customizable-badge-${product.id}`}>
                      Customizable
                    </Badge>
                  )}
                  {/* Wishlist Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast({
                          title: "Login required",
                          description: "Please log in to add items to your wishlist",
                          variant: "destructive",
                        });
                        return;
                      }
                      toggleWishlist(product.id);
                    }}
                    disabled={isPending}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`wishlist-toggle-${product.id}`}
                  >
                    <Heart 
                      className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                    />
                  </Button>
                </div>
                <CardContent className="p-6">
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-2" data-testid={`product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                    {product.description || "Premium teak furniture crafted with precision and care."}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-[#254127]" data-testid={`product-price-${product.id}`}>
                          ${parseFloat(product.basePrice).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">starting</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        variant="outline"
                        className="flex-1 border-[#254127] text-[#254127] hover:bg-[#254127] hover:text-white"
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Link href={`/configurator/${product.id}`}>
                        <Button 
                          className="bg-[#254127] hover:bg-[#1a2f1b]"
                          data-testid={`configure-button-${product.id}`}
                        >
                          {product.isCustomizable ? 'Customize' : 'View'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProducts.map((product: any) => (
              <Card key={product.id} className="overflow-hidden" data-testid={`product-list-${product.id}`}>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 aspect-square md:aspect-auto relative group">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        No Image
                      </div>
                    )}
                    {/* Wishlist Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast({
                            title: "Login required",
                            description: "Please log in to add items to your wishlist",
                            variant: "destructive",
                          });
                          return;
                        }
                        toggleWishlist(product.id);
                      }}
                      disabled={isPending}
                      className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`wishlist-toggle-list-${product.id}`}
                    >
                      <Heart 
                        className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} 
                      />
                    </Button>
                  </div>
                  <CardContent className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {product.category.replace('-', ' ').toUpperCase()}
                          </Badge>
                          {product.isCustomizable && (
                            <Badge className="bg-[#254127]">
                              Customizable
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {product.description || "Premium teak furniture crafted with precision and care."}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#254127] mb-2">
                          ${parseFloat(product.basePrice).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 mb-4">starting</div>
                        <div className="space-y-2">
                          <Button 
                            onClick={() => handleAddToCart(product)}
                            variant="outline"
                            className="w-full border-[#254127] text-[#254127] hover:bg-[#254127] hover:text-white"
                            data-testid={`add-to-cart-list-${product.id}`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                          <Link href={`/configurator/${product.id}`}>
                            <Button className="w-full bg-[#254127] hover:bg-[#1a2f1b]">
                              {product.isCustomizable ? 'Customize' : 'View Details'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or browse all categories.
            </p>
            <Button onClick={() => setSelectedCategory("all")} variant="outline">
              View All Products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}