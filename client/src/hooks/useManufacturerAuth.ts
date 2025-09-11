import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useManufacturerAuth() {
  const { data: manufacturerUser, isLoading, error } = useQuery({
    queryKey: ["/api/manufacturer/auth/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/manufacturer/auth/me");
        return response.json();
      } catch (error: any) {
        if (error.message?.includes("401") || error.message?.includes("403")) {
          // Return null for unauthorized/forbidden - user is not manufacturer
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    manufacturerUser,
    isLoading,
    isManufacturer: !!manufacturerUser && manufacturerUser.role === "manufacturer",
    isAuthenticated: !!manufacturerUser,
    error,
  };
}