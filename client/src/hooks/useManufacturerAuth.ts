import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useManufacturerAuth() {
  // For now, allow access to manufacturer dashboard without authentication
  // TODO: Implement proper manufacturer login when needed
  const mockManufacturerUser = {
    id: "demo-manufacturer",
    email: "manufacturer@teaktheory.com",
    firstName: "Demo",
    lastName: "Manufacturer",
    role: "manufacturer"
  };

  return {
    manufacturerUser: mockManufacturerUser,
    isLoading: false,
    isManufacturer: true,
    isAuthenticated: true,
    error: null,
  };
}