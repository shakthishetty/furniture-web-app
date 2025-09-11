import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Timeline, 
  UpdateCard, 
  PhotoGrid, 
  ReplyThread, 
  useManufacturingSSE,
  type ManufacturingProcess
} from "@/components/manufacturing";
import type { StageUpdate } from "@shared/schema";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  RefreshCw
} from "lucide-react";

interface OrderWithTracking {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  hasTracking: boolean;
  trackingStatus: string | null;
}

export default function OrderTracking() {
  const { orderId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [expandedUpdates, setExpandedUpdates] = useState<Set<string>>(new Set());

  // Fetch order details first to verify ownership
  const { 
    data: order, 
    isLoading: orderLoading, 
    error: orderError 
  } = useQuery<OrderWithTracking>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId && isAuthenticated,
    retry: (failureCount, error) => {
      // Don't retry if it's a 404 or 403
      if (error?.message?.includes("404") || error?.message?.includes("403")) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Fetch manufacturing process for this order
  const { 
    data: manufacturingProcess, 
    isLoading: processLoading, 
    error: processError,
    refetch: refetchProcess
  } = useQuery<ManufacturingProcess & { 
    stages: Array<any & { 
      updates: Array<any & { 
        photos?: any[], 
        replies?: any[] 
      }> 
    }> 
  }>({
    queryKey: ['/api/orders', orderId, 'tracking'],
    enabled: !!orderId && !!order && order.hasTracking,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
    retry: (failureCount, error) => {
      if (error?.message?.includes("404")) return false;
      return failureCount < 3;
    }
  });

  // Real-time SSE connection
  const {
    isConnected: sseConnected,
    error: sseError,
    connect: reconnectSSE
  } = useManufacturingSSE(
    manufacturingProcess?.id || '',
    'customer',
    {
      processId: manufacturingProcess?.id,
      showToastNotifications: true,
      autoReconnect: true,
      onMessage: (message) => {
        // Handle different message types
        if (message.type === 'new_update' && !message.data?.isInternal) {
          // Invalidate queries to get fresh data
          queryClient.invalidateQueries({ 
            queryKey: ['/api/orders', orderId, 'tracking'] 
          });
        } else if (message.type === 'new_reply' && message.data?.authorRole !== 'customer') {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/orders', orderId, 'tracking'] 
          });
        } else if (message.type === 'stage_status_update') {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/orders', orderId, 'tracking'] 
          });
        }
      },
      onConnect: () => {
        console.log('Customer SSE connected for order:', orderId);
      },
      onError: (error) => {
        console.warn('Customer SSE connection error:', error);
      }
    }
  );

  // Customer reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ updateId, content }: { updateId: string; content: string }) => {
      const response = await apiRequest(
        'POST', 
        `/api/orders/${orderId}/tracking/updates/${updateId}/replies`,
        { message: content }
      );
      return response.json();
    },
    onSuccess: (reply, { updateId }) => {
      toast({
        title: "Reply Posted",
        description: "Your message has been sent to the manufacturer.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/orders', orderId, 'tracking'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/orders', orderId, 'tracking', 'updates', updateId, 'replies'] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Post Reply",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, setLocation]);

  // Handle stage selection for detailed view
  const handleStageClick = (stage: any) => {
    setSelectedStage(selectedStage?.id === stage.id ? null : stage);
  };

  // Toggle update expansion
  const toggleUpdateExpansion = (updateId: string) => {
    setExpandedUpdates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
  };

  // Handle reply submission
  const handleReply = (updateId: string, content: string) => {
    replyMutation.mutate({ updateId, content });
  };

  const getProcessStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'not_started':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Not Started</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case 'on_hold':
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">On Hold</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading states
  if (!isAuthenticated || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error states
  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Order Not Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The order you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <div className="space-x-4">
                <Button onClick={() => setLocation('/orders')} variant="outline" data-testid="button-back-to-orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
                <Button onClick={() => setLocation('/')} data-testid="button-back-home">
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order.hasTracking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/orders')}
              className="mb-4"
              data-testid="button-back-to-orders"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Order #{order.orderNumber}
            </h1>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Manufacturing Tracking Not Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Manufacturing tracking is not available for this order yet. 
                Tracking will be available once production begins.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Order Status: <Badge className={`ml-1 ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </Badge>
              </p>
              <Button onClick={() => setLocation('/orders')} data-testid="button-view-all-orders">
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/orders')}
            className="mb-4"
            data-testid="button-back-to-orders"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-order-title">
                Manufacturing Progress
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span data-testid="text-order-number">Order #{order.orderNumber}</span>
                <span data-testid="text-order-date">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {formatDate(order.createdAt)}
                </span>
                <span data-testid="text-order-total">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  ${parseFloat(order.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Connection status */}
            <div className="flex items-center gap-2">
              {sseConnected ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm" data-testid="connection-status-connected">
                  <Wifi className="h-4 w-4" />
                  Live Updates
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <WifiOff className="h-4 w-4" />
                  <span data-testid="connection-status-disconnected">Offline</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reconnectSSE}
                    data-testid="button-reconnect-sse"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {processLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : processError ? (
          <Alert variant="destructive" data-testid="alert-process-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load manufacturing progress. 
              <Button variant="link" className="p-0 h-auto ml-2" onClick={() => refetchProcess()}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : manufacturingProcess ? (
          <div className="space-y-6">
            {/* Process Overview */}
            <Card data-testid="card-process-overview">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Manufacturing Overview</CardTitle>
                  {getProcessStatusBadge(manufacturingProcess.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {manufacturingProcess.startedAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Started</div>
                        <div className="text-muted-foreground" data-testid="text-process-started">
                          {formatDate(typeof manufacturingProcess.startedAt === 'string' 
                            ? manufacturingProcess.startedAt 
                            : manufacturingProcess.startedAt.toISOString()
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {manufacturingProcess.estimatedCompletionDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Est. Completion</div>
                        <div className="text-muted-foreground" data-testid="text-process-estimated-completion">
                          {formatDate(typeof manufacturingProcess.estimatedCompletionDate === 'string' 
                            ? manufacturingProcess.estimatedCompletionDate 
                            : manufacturingProcess.estimatedCompletionDate.toISOString()
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Manufacturer</div>
                      <div className="text-muted-foreground" data-testid="text-process-manufacturer">
                        {manufacturingProcess.assignedManufacturerId || 'Unassigned'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {manufacturingProcess.notes && (
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground" data-testid="text-process-notes">
                      {manufacturingProcess.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Timeline
              process={manufacturingProcess}
              userRole="customer"
              onStageClick={handleStageClick}
              data-testid="timeline-customer"
            />

            {/* Stage Details */}
            {selectedStage && (
              <Card data-testid={`card-stage-detail-${selectedStage.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Stage Details: {selectedStage.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedStage(null)}
                      data-testid="button-close-stage-detail"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedStage.updates?.filter((update: any) => !update.isInternal).map((update: any) => (
                    <UpdateCard
                      key={update.id}
                      update={update}
                      userRole="customer"
                      onReply={handleReply}
                      isReplying={replyMutation.isPending}
                      showFullContent={expandedUpdates.has(update.id)}
                      data-testid={`update-card-${update.id}`}
                    />
                  ))}
                  
                  {selectedStage.updates?.filter((update: any) => !update.isInternal).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground" data-testid="empty-stage-updates">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No updates available for this stage yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Feed */}
            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle>Recent Manufacturing Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {manufacturingProcess.stages
                  ?.flatMap(stage => 
                    stage.updates?.filter((update: StageUpdate) => !update.isInternal).map((update: StageUpdate) => ({
                      ...update,
                      stageName: stage.name
                    })) || []
                  )
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((update: any) => (
                    <UpdateCard
                      key={update.id}
                      update={update}
                      userRole="customer"
                      onReply={handleReply}
                      isReplying={replyMutation.isPending}
                      showFullContent={false}
                      data-testid={`recent-update-${update.id}`}
                    />
                  ))}
                
                {manufacturingProcess.stages
                  ?.flatMap(stage => stage.updates?.filter((update: StageUpdate) => !update.isInternal) || [])
                  .length === 0 && (
                  <div className="text-center py-8 text-muted-foreground" data-testid="empty-recent-updates">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No manufacturing updates yet. Updates will appear here as work progresses.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Manufacturing Process Not Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We couldn't find manufacturing details for this order.
              </p>
              <Button onClick={() => refetchProcess()} data-testid="button-retry-process">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}