import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { resetAuthState } from "@/lib/authUtils";
import { Shield, LogIn } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/admin-login", credentials);
      return response.json();
    },
    onSuccess: async (data) => {
      // Use separate storage keys for admin to not affect customer login
      localStorage.setItem("adminAccessToken", data.accessToken);
      localStorage.setItem("adminRefreshToken", data.refreshToken);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/admin/me'] });
      
      setLocation("/admin");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#254127] text-white">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
            <CardDescription>
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-admin-email"
                  className="mt-1"
                  placeholder="furniture@gmail.com"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-admin-password"
                  className="mt-1"
                  placeholder="Enter password"
                />
              </div>

              {loginMutation.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(loginMutation.error as any)?.message || "Invalid admin credentials. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#254127] hover:bg-[#1a2f1b]"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                <LogIn className="h-4 w-4 mr-2" />
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
