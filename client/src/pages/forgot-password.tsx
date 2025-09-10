import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/auth/forgot-password', { email });
      return await response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: 'Reset link sent',
        description: 'If an account exists with this email, a password reset link has been sent.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      forgotPasswordMutation.mutate(email);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/">
              <h1 className="text-3xl font-bold text-[#254127] mb-2">Teak Theory</h1>
            </Link>
            <div className="mt-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Check your email</h2>
              <p className="mt-2 text-sm text-gray-600">
                If an account exists with this email address, we've sent you a password reset link.
              </p>
              <div className="mt-6">
                <Link href="/login">
                  <Button className="w-full bg-[#254127] hover:bg-[#1a2f1b]">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-[#254127] mb-2">Teak Theory</h1>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Forgot your password?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mt-1"
                data-testid="email-input"
                required
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-[#254127] hover:bg-[#1a2f1b]"
              disabled={forgotPasswordMutation.isPending}
              data-testid="reset-button"
            >
              {forgotPasswordMutation.isPending ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="link" className="text-sm" data-testid="back-to-login">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}