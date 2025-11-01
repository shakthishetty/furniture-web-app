import { useQuery } from "@tanstack/react-query";

export function useAdminAuth() {
  // Check if user is authenticated as admin by checking localStorage
  const { data: adminUser, isLoading, error } = useQuery({
    queryKey: ["/api/admin/auth/check"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const user = localStorage.getItem("user");
      
      if (!token || !user) {
        return null;
      }
      
      try {
        const parsedUser = JSON.parse(user);
        
        // Decode JWT to check if it's admin
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (payload.isAdmin === true && payload.role === 'admin') {
          return parsedUser;
        }
        
        return null;
      } catch (e) {
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