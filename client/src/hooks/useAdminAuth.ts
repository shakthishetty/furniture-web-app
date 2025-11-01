import { useQuery } from "@tanstack/react-query";

export function useAdminAuth() {
  // Validate admin authentication with backend
  const { data: adminUser, isLoading, error } = useQuery({
    queryKey: ["/api/auth/admin/me"],
    queryFn: async () => {
      const token = localStorage.getItem("adminAccessToken");
      
      if (!token) {
        return null;
      }
      
      try {
        // Call backend to validate admin token
        const response = await fetch("/api/auth/admin/me", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          // Clear invalid tokens
          localStorage.removeItem("adminAccessToken");
          localStorage.removeItem("adminRefreshToken");
          localStorage.removeItem("adminUser");
          return null;
        }
        
        const data = await response.json();
        return data;
      } catch (e) {
        // Clear tokens on error
        localStorage.removeItem("adminAccessToken");
        localStorage.removeItem("adminRefreshToken");
        localStorage.removeItem("adminUser");
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    adminUser,
    isLoading,
    isAdmin: !!adminUser,
    isAuthenticated: !!adminUser,
    error,
  };
}