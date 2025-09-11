import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Calendar,
  DollarSign,
  MapPin,
  Activity,
} from "lucide-react";
import type { Order, OrderItem } from "@shared/schema";

interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface OrderWithTracking extends Order {
  hasTracking: boolean;
  trackingStatus: string | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "paid":
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "canceled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Package className="h-4 w-4" />;
    case "paid":
    case "processing":
      return <Package className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "delivered":
      return <CheckCircle className="h-4 w-4" />;
    case "canceled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

function OrderCard({ order }: { order: OrderWithTracking }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Fetch order details
  const { data: orderDetails } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${order.id}`],
    enabled: showDetails,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await apiRequest("POST", `/api/orders/${order.id}/cancel`, {
        reason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order canceled",
        description: "Your order has been canceled successfully. Refund will be processed shortly.",
      });
      setShowCancelDialog(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel order",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCancelOrder = () => {
    if (cancelReason.trim()) {
      cancelOrderMutation.mutate(cancelReason.trim());
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      // Use authenticated fetch instead of window.open to send Authorization header
      const response = await apiRequest("GET", `/api/orders/${order.id}/invoice`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.orderNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canCancelOrder = order.status === "pending" || order.status === "paid" || order.status === "processing";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(order.status)}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </Badge>
            <p className="text-lg font-semibold mt-1">
              <DollarSign className="h-4 w-4 inline mr-1" />
              ${parseFloat(order.totalAmount).toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="flex items-center justify-between text-sm">
            <span>Payment Status:</span>
            <Badge variant={order.paymentStatus === "paid" ? "default" : "secondary"}>
              {order.paymentStatus}
            </Badge>
          </div>

          {order.trackingNumber && (
            <div className="flex items-center justify-between text-sm">
              <span>Tracking Number:</span>
              <span className="font-mono">{order.trackingNumber}</span>
            </div>
          )}

          {order.estimatedDeliveryDate && (
            <div className="flex items-center justify-between text-sm">
              <span>Estimated Delivery:</span>
              <span>{new Date(order.estimatedDeliveryDate).toLocaleDateString()}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {/* Manufacturing Tracking Button */}
            {order.hasTracking && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setLocation(`/orders/${order.id}/tracking`)}
                data-testid={`button-view-tracking-${order.id}`}
              >
                <Activity className="h-4 w-4 mr-1" />
                View Progress
              </Button>
            )}
            
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid={`button-view-details-${order.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Order #{order.orderNumber}</DialogTitle>
                </DialogHeader>
                
                {orderDetails && (
                  <div className="space-y-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-3">Items</h4>
                      <div className="space-y-3">
                        {orderDetails.items.map((item, index) => (
                          <div key={index} className="flex gap-3 p-3 border rounded-lg">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h5 className="font-medium">{item.productName}</h5>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              <p className="text-sm font-medium">
                                ${parseFloat(item.unitPrice).toFixed(2)} each
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                ${parseFloat(item.totalPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pricing Breakdown */}
                    <div>
                      <h4 className="font-semibold mb-3">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${parseFloat(order.subtotal || "0").toFixed(2)}</span>
                        </div>
                        {parseFloat(order.discountAmount || "0") > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-${parseFloat(order.discountAmount || "0").toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(order.taxAmount || "0") > 0 && (
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>${parseFloat(order.taxAmount || "0").toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(order.shippingAmount || "0") > 0 && (
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>${parseFloat(order.shippingAmount || "0").toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>${parseFloat(order.totalAmount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Shipping Address
                      </h4>
                      <p className="text-sm text-gray-600">
                        Address information would be displayed here
                      </p>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={handleDownloadInvoice} data-testid={`button-download-invoice-${order.id}`}>
              <Download className="h-4 w-4 mr-1" />
              Invoice
            </Button>

            {canCancelOrder && (
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Cancel Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this order? This action cannot be undone.
                      A refund will be processed according to our refund policy.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cancel-reason">Reason for cancellation</Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Please provide a reason for canceling this order..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelOrder}
                      disabled={!cancelReason.trim() || cancelOrderMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {cancelOrderMutation.isPending ? "Canceling..." : "Cancel Order"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Orders() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user orders with tracking status
  const { data: orders = [], isLoading } = useQuery<OrderWithTracking[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button onClick={() => setLocation("/catalog")}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}