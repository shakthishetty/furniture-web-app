import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause,
  Activity,
  Calendar,
  User,
  Package,
  Package2,
  MapPin
} from "lucide-react";

interface ManufacturingProcess {
  id: string;
  orderId: string;
  status: string;
  startDate: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    userId: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    subtotal: string;
    totalAmount: string;
    createdAt: string;
    customer?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      productImage?: string;
    }>;
    shippingAddress?: {
      id: string;
      firstName: string;
      lastName: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
  stages: Array<{
    id: string;
    name: string;
    status: string;
    position: number;
    recentUpdates: Array<{
      id: string;
      title: string;
      content: string;
      createdAt: string;
    }>;
  }>;
  totalStages: number;
  completedStages: number;
}

interface ProcessesResponse {
  processes: ManufacturingProcess[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export default function ManufacturerProcesses() {
  const [page, setPage] = useState(1);
  
  const { data: processesData, isLoading } = useQuery<ProcessesResponse>({
    queryKey: ['/api/manufacturer/processes', page],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/manufacturer/processes?page=${page}&limit=20`);
      return response.json();
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Pending</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "paused":
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "in_progress":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="manufacturer-processes">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900" data-testid="text-processes-title">
            Manufacturing Processes
          </h1>
          <p className="text-sm text-gray-600 mt-1" data-testid="text-processes-description">
            {processesData?.total || 0} total processes assigned to you
          </p>
        </div>

        {/* Processes List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : processesData?.processes && processesData.processes.length > 0 ? (
            processesData.processes.map((process) => (
              <div key={process.id} 
                   className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
                   data-testid={`process-${process.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Process ID and Status */}
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-mono font-medium text-gray-900">
                        #{process.id.slice(0, 8)}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(process.status)}
                        {getStatusBadge(process.status)}
                      </div>
                    </div>

                    {/* Order Details */}
                    {process.order && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">Order</span>
                          <span className="text-sm font-mono text-gray-900">#{process.order.orderNumber}</span>
                        </div>

                        {/* Customer Information */}
                        {process.order.customer && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {process.order.customer.firstName} {process.order.customer.lastName}
                            </span>
                            <span className="text-sm text-gray-400">({process.order.customer.email})</span>
                          </div>
                        )}

                        {/* Order Items */}
                        {process.order.items && process.order.items.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Package2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {process.order.items.map(item => `${item.productName} (${item.quantity})`).join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Shipping Address */}
                        {process.order.shippingAddress && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {process.order.shippingAddress.city}, {process.order.shippingAddress.state}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">
                          {process.completedStages}/{process.totalStages}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Started: {process.startDate ? new Date(process.startDate).toLocaleDateString() : 'Invalid Date'}
                      </div>
                    </div>

                    {/* Notes */}
                    {process.notes && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-600">Notes</div>
                        <div className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded">
                          {process.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <div className="ml-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild 
                      data-testid={`button-view-details-${process.id}`}
                    >
                      <Link href={`/manufacturer/processes/${process.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg border p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No processes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No manufacturing processes have been assigned to you yet.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {processesData && processesData.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              data-testid="button-prev-page"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, processesData.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    data-testid={`button-page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(processesData.totalPages, page + 1))}
              disabled={page === processesData.totalPages}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}