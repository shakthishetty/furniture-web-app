import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAdminAuth() {
  // TEMPORARY: Bypass authentication for development
  const mockAdminUser = {
    id: "temp-admin",
    email: "admin@temp.com",
    isAdmin: true,
    name: "Temp Admin"
  };

  return {
    adminUser: mockAdminUser,
    isLoading: false,
    isAdmin: true,
    isAuthenticated: true,
    error: null,
  };

  /* ORIGINAL CODE - COMMENTED OUT FOR DEVELOPMENT
  const { data: adminUser, isLoading, error } = useQuery({
    queryKey: ["/api/admin/auth/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/auth/me");
        return response.json();
      } catch (error: any) {
        if (error.message?.includes("401") || error.message?.includes("403")) {
          // Return null for unauthorized/forbidden - user is not admin
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    adminUser,
    isLoading,
    isAdmin: !!adminUser && adminUser.isAdmin,
    isAuthenticated: !!adminUser,
    error,
  };
  */
}