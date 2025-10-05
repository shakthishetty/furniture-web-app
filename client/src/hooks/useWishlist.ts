import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useWishlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get wishlist items
  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['/api/wishlist'],
    retry: false,
  });

  const wishlistItems = (wishlistData as any) || [];

  // Check if product is in wishlist
  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item: any) => item.productId === productId);
  };

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (data: { productId: string; notes?: string }) => {
      const response = await apiRequest('POST', '/api/wishlist', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Added to wishlist",
        description: "Product has been saved to your wishlist.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to wishlist",
        variant: "destructive",
      });
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest('DELETE', `/api/wishlist/${productId}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Removed from wishlist",
        description: "Product has been removed from your wishlist.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove from wishlist",
        variant: "destructive",
      });
    },
  });

  // Toggle wishlist
  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeFromWishlistMutation.mutateAsync(productId);
    } else {
      await addToWishlistMutation.mutateAsync({ productId });
    }
  };

  const getWishlistCount = () => wishlistItems.length;

  return {
    wishlistItems,
    isLoading,
    isInWishlist,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    toggleWishlist,
    getWishlistCount,
    isPending: addToWishlistMutation.isPending || removeFromWishlistMutation.isPending,
  };
}
