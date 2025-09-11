import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Package, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: string;
  total: number;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  notes?: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all_time");
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const { toast } = useToast();
  const limit = 20;

  const { data: ordersData, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["/api/admin/orders", page, statusFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateRange && dateRange !== "all_time") {
        const days = parseInt(dateRange);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        params.append("startDate", startDate.toISOString());
        params.append("endDate", endDate.toISOString());
      }

      const response = await apiRequest("GET", `/api/admin/orders?${params.toString()}`);
      return response.json();
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, comment }: { orderId: string; status: string; comment?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/orders/${orderId}/status`, {
        status,
        comment,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      setUpdatingOrderId(null);
      setNewStatus("");
      setStatusNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleStatusUpdate = (orderId: string, status: string) => {
    updateOrderStatusMutation.mutate({ 
      orderId, 
      status, 
      comment: statusNote || undefined 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "processing":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "shipped":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Shipped</Badge>;
      case "delivered":
        return <Badge variant="default" className="bg-green-100 text-green-800">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "refunded":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-orders-title">Orders</h1>
          <p className="text-muted-foreground" data-testid="text-orders-description">
            Manage customer orders and fulfillment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8 text-muted-foreground" />
          <span className="text-2xl font-bold" data-testid="text-total-orders">
            {ordersData?.total || 0}
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter orders by status and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger data-testid="select-date-range">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_time">All time</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {ordersData ? `${ordersData.orders.length} of ${ordersData.total} orders` : "Loading orders..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : ordersData?.orders.length ? (
            <div className="space-y-4">
              {ordersData.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded hover:bg-muted/50" data-testid={`order-row-${order.id}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" data-testid={`text-order-id-${order.id}`}>
                        Order #{order.id.slice(-8)}
                      </span>
                      <span className="font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span data-testid={`text-order-customer-${order.id}`}>
                        {order.userName} ({order.userEmail})
                      </span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span data-testid={`text-order-date-${order.id}`}>
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <span className="text-sm text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <Select
                        value={updatingOrderId === order.id ? newStatus : order.status}
                        onValueChange={(value) => {
                          setUpdatingOrderId(order.id);
                          setNewStatus(value);
                        }}
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-order-status-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {updatingOrderId === order.id && newStatus !== order.status && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, newStatus)}
                            disabled={updateOrderStatusMutation.isPending}
                            data-testid={`button-update-status-${order.id}`}
                          >
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUpdatingOrderId(null);
                              setNewStatus("");
                            }}
                            data-testid={`button-cancel-update-${order.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                      data-testid={`button-view-order-${order.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {ordersData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4" data-testid="text-page-info">
                    Page {page} of {ordersData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === ordersData.totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-orders">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Note Input */}
      {updatingOrderId && (
        <Card>
          <CardHeader>
            <CardTitle>Add Status Update Note</CardTitle>
            <CardDescription>Optional note about the status change</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter a note about this status change (optional)..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              data-testid="textarea-status-note"
            />
          </CardContent>
        </Card>
      )}

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl" data-testid="dialog-view-order">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete order information and items
            </DialogDescription>
          </DialogHeader>
          
          {viewingOrder && (
            <div className="space-y-6 py-4 max-h-96 overflow-y-auto">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order ID</Label>
                  <p className="font-medium">#{viewingOrder.id}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(viewingOrder.status)}
                  </div>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{viewingOrder.userName}</p>
                  <p className="text-sm text-muted-foreground">{viewingOrder.userEmail}</p>
                </div>
                <div>
                  <Label>Order Date</Label>
                  <p className="font-medium">{formatDate(viewingOrder.createdAt)}</p>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <p className="font-medium text-lg">{formatPrice(viewingOrder.total)}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="font-medium">{viewingOrder.paymentMethod}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <Label>Shipping Address</Label>
                <div className="mt-1 p-3 bg-muted rounded">
                  <p>{viewingOrder.shippingAddress.street}</p>
                  <p>
                    {viewingOrder.shippingAddress.city}, {viewingOrder.shippingAddress.state} {viewingOrder.shippingAddress.zipCode}
                  </p>
                  <p>{viewingOrder.shippingAddress.country}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <Label>Order Items</Label>
                <div className="mt-2 space-y-2">
                  {viewingOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="font-medium">{formatPrice(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tracking & Notes */}
              {viewingOrder.trackingNumber && (
                <div>
                  <Label>Tracking Number</Label>
                  <p className="font-medium">{viewingOrder.trackingNumber}</p>
                </div>
              )}

              {viewingOrder.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground">{viewingOrder.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} data-testid="button-close-view">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}