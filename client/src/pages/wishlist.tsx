import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";

export default function Wishlist() {
  const { wishlistItems, isLoading, removeFromWishlist, isPending } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleRemove = async (productId: string) => {
    removeFromWishlist(productId);
  };

  const handleAddToCart = (item: any) => {
    addToCart({
      productId: item.product.id,
      name: item.product.name,
      price: parseFloat(item.product.basePrice),
      imageUrl: item.product.imageUrl,
    });
    
    toast({
      title: "Added to cart!",
      description: `${item.product.name} has been added to your cart.`,
    });
  };

  const handleCustomize = (productId: string) => {
    setLocation(`/configurator/${productId}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
            Please log in to view your wishlist
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sign in to save your favorite products
          </p>
          <Link href="/login">
            <Button className="px-8 py-3">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-serif mb-4" data-testid="page-title">
            My Wishlist
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg" data-testid="page-description">
            Save your favorite pieces for later and never lose track of what you love.
          </p>
        </div>

        {/* Wishlist Items */}
        {wishlistItems.filter((item: any) => item.product).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistItems.filter((item: any) => item.product).map((item: any) => (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                data-testid={`wishlist-item-${item.id}`}
              >
                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item.productId)}
                  disabled={isPending}
                  className="absolute top-3 right-3 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                  data-testid={`remove-wishlist-${item.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Product Image */}
                <Link href={`/configurator/${item.product.id}`}>
                  <div className="cursor-pointer">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Product Details */}
                <div className="p-4 space-y-3">
                  <Link href={`/configurator/${item.product.id}`}>
                    <h3
                      className="font-medium text-base text-gray-900 dark:text-gray-100 hover:text-primary cursor-pointer line-clamp-2"
                      data-testid={`product-name-${item.id}`}
                    >
                      {item.product.name}
                    </h3>
                  </Link>

                  <p
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                    data-testid={`product-price-${item.id}`}
                  >
                    ${parseFloat(item.product.basePrice).toLocaleString()}
                  </p>

                  {item.product.category && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {item.product.category.replace('-', ' ')}
                    </p>
                  )}

                  {item.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Note: {item.notes}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleCustomize(item.product.id)}
                      className="flex-1"
                      size="sm"
                      data-testid={`customize-${item.id}`}
                    >
                      Customize
                    </Button>
                    <Button
                      onClick={() => handleAddToCart(item)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      data-testid={`add-to-cart-${item.id}`}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start exploring our collections to find pieces you love
            </p>
            <Link href="/catalog">
              <Button className="px-8 py-3" data-testid="browse-products-button">
                Browse Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
