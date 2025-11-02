import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Package } from "lucide-react";

export default function OrderSuccess() {
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('session_id');
    setSessionId(id);
  }, []);

  const { data: orders, isLoading } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    enabled: !!sessionId,
  });

  const latestOrder = orders && orders.length > 0 ? orders[0] : null;

  if (isLoading || !sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Processing your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-100 rounded-full p-3 w-fit">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                Thank you for your order. Your payment has been processed successfully.
              </p>
              {latestOrder && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Order Number</p>
                  <p className="text-xl font-bold text-gray-900" data-testid="text-order-number">
                    {latestOrder.orderNumber}
                  </p>
                  <p className="text-sm text-gray-600 mt-3 mb-1">Total Amount</p>
                  <p className="text-lg font-semibold text-gray-900" data-testid="text-order-total">
                    ${parseFloat(latestOrder.totalAmount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                What's Next?
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• You'll receive an order confirmation email shortly</li>
                <li>• Track your order status in your orders page</li>
                <li>• You can view manufacturing progress updates in real-time</li>
                <li>• We'll notify you when your order ships</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => setLocation("/orders")}
                data-testid="button-view-orders"
              >
                View My Orders
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation("/products")}
                data-testid="button-continue-shopping"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
