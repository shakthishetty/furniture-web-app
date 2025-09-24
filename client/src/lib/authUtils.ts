import { QueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

/**
 * Completely reset authentication state - logout from server and clear all client data
 */
export async function resetAuthState(queryClient: QueryClient) {
  try {
    // Get existing refresh token
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Call logout endpoint to invalidate server-side session
    if (refreshToken) {
      try {
        await apiRequest('POST', '/api/auth/logout', { refreshToken });
      } catch (error) {
        // Ignore logout errors - token might already be invalid
        console.warn('Logout request failed:', error);
      }
    }
  } catch (error) {
    // Continue with cleanup even if server logout fails
    console.warn('Auth reset warning:', error);
  }
  
  // Clear all client-side authentication data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Clear React Query cache for authentication
  queryClient.removeQueries({ queryKey: ['/api/auth/me'] });
  queryClient.removeQueries({ queryKey: ['/api/orders'] });
  queryClient.removeQueries({ queryKey: ['/api/notifications'] });
}