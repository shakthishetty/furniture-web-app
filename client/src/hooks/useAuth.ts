import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        return response.json();
      } catch (error: any) {
        if (error.message?.includes("401") || error.message?.includes("No token provided")) {
          // Return null for unauthorized - user is not logged in
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If user is null due to 401/unauthorized, consider it as "not authenticated" but not an error
  const isUnauthorized = error?.message?.includes("401") || error?.message?.includes("No token provided");
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error: isUnauthorized ? null : error, // Don't treat 401 as an error
  };
}