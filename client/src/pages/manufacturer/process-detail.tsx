import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Timeline, 
  UpdateCard, 
  PhotoGrid, 
  ReplyThread, 
  StageUpdateComposer, 
  useManufacturingSSE 
} from "@/components/manufacturing";
import { ManufacturingProgressBar } from "@/components/manufacturing/ManufacturingProgressBar";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause, 
  Play, 
  Package,
  Calendar,
  User,
  Upload,
  Camera
} from "lucide-react";
import { Link } from "wouter";
import type { 
  ManufacturingProcess, 
  ManufacturingStage, 
  StageUpdate,
  StageStatusUpdateRequest 
} from "@shared/schema";

interface ProcessWithDetails extends ManufacturingProcess {
  order?: {
    // Basic order info
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    
    // Pricing details
    subtotal: string;
    discountAmount: string | null;
    taxAmount: string | null;
    shippingAmount: string | null;
    totalAmount: string;
    
    // Customer information
    customer: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
    
    // Order items with product details
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      productImage: string | null;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      customConfiguration: any;
    }>;
    
    // Addresses
    shippingAddress: {
      label: string;
      firstName: string;
      lastName: string;
      street: string;
      apartment: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone: string | null;
    } | null;
    
    billingAddress: {
      label: string;
      firstName: string;
      lastName: string;
      street: string;
      apartment: string | null;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone: string | null;
    } | null;
    
    // Additional details
    discountCodeUsed: string | null;
    trackingNumber: string | null;
    shippingCarrier: string | null;
    estimatedDeliveryDate: Date | null;
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
  };
  stages: Array<ManufacturingStage & {
    updates: Array<StageUpdate & {
      photos: Array<{
        id: string;
        updateId: string;
        url: string;
        filename: string | null;
        width: number | null;
        height: number | null;
        blurhash: string | null;
        createdAt: Date | null;
      }>;
      replies: Array<{
        id: string;
        updateId: string;
        message: string;
        authorUserId: string;
        authorRole: string;
        createdAt: Date | null;
      }>;
    }>;
  }>;
}

export default function ManufacturerProcessDetail() {
  const { id: processId } = useParams<{ id: string }>();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [stageStatusUpdate, setStageStatusUpdate] = useState<{
    stageId: string;
    status: string;
    notes: string;
  } | null>(null);
  const { toast } = useToast();

  // Enable real-time updates for this process
  useManufacturingSSE(processId, 'manufacturer');

  const { data: process, isLoading, error } = useQuery<ProcessWithDetails>({
    queryKey: ["/api/manufacturer/processes", processId],
    queryFn: async () => {
      if (!processId) throw new Error("Process ID is required");
      const response = await apiRequest("GET", `/api/manufacturer/processes/${processId}`);
      return response.json();
    },
    enabled: !!processId,
  });

  const updateStageMutation = useMutation({
    mutationFn: async (data: { stageId: string; update: StageStatusUpdateRequest }) => {
      const response = await apiRequest(
        "PUT", 
        `/api/manufacturer/processes/${processId}/stages/${data.stageId}/status`,
        data.update
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/processes", processId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/processes"] });
      toast({
        title: "Success",
        description: "Stage status updated successfully",
      });
      setStageStatusUpdate(null);
    },
    onError: (error: any) => {
      // Extract meaningful error message from validation errors
      let errorMessage = "Failed to update stage status";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific validation errors for completion requirements
      if (errorMessage.includes("No photos have been uploaded")) {
        errorMessage = "📸 Photos Required: Please upload at least one photo showing your progress before marking this stage as completed.";
      } else if (errorMessage.includes("No meaningful progress updates")) {
        errorMessage = "📝 Update Required: Please add a detailed progress update describing the work completed before marking as completed.";
      }
      
      toast({
        title: "Cannot Complete Stage",
        description: errorMessage,
        variant: "destructive",
        duration: 6000, // Show longer for validation errors
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Pending</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "awaiting_approval":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Awaiting Approval</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-600" />;
      case "awaiting_approval":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleStageStatusChange = (stageId: string, newStatus: string) => {
    const stage = process?.stages.find(s => s.id === stageId);
    if (!stage) return;

    setStageStatusUpdate({
      stageId,
      status: newStatus,
      notes: ""
    });
  };

  const confirmStageStatusUpdate = () => {
    if (!stageStatusUpdate) return;

    const updateData: StageStatusUpdateRequest = {
      status: stageStatusUpdate.status as any,
      notes: stageStatusUpdate.notes || undefined,
    };

    // Auto-set timestamps based on status
    if (stageStatusUpdate.status === 'in_progress') {
      updateData.startedAt = new Date().toISOString();
    }
    if (stageStatusUpdate.status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }

    updateStageMutation.mutate({
      stageId: stageStatusUpdate.stageId,
      update: updateData
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-6 bg-muted rounded animate-pulse"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h3 className="text-lg font-semibold mb-2">Process Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The requested manufacturing process could not be found or you don't have access to it.
          </p>
          <Button asChild data-testid="button-back-to-processes">
            <Link href="/manufacturer/processes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Processes
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="process-detail">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild data-testid="button-back">
          <Link href="/manufacturer/processes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-process-title">
            Order {process.orderId}
          </h1>
          <p className="text-muted-foreground" data-testid="text-process-description">
            Manufacturing Process Details
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(process.status)}
          {getStatusBadge(process.status)}
        </div>
      </div>

      {/* Process Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card data-testid="card-process-info" className="bg-gradient-to-br from-background to-blue-50/30 dark:to-blue-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Process Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex justify-between items-center py-2 border-b border-muted">
              <span className="text-muted-foreground font-medium">Status:</span>
              <div className="flex items-center gap-1">
                {getStatusIcon(process.status)}
                {getStatusBadge(process.status)}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-muted">
              <span className="text-muted-foreground font-medium">Started:</span>
              <span className="text-sm font-semibold">
                {process.startedAt ? new Date(process.startedAt).toLocaleDateString() : 'Not started'}
              </span>
            </div>
            {process.estimatedCompletionDate && (
              <div className="flex justify-between items-center py-2 border-b border-muted">
                <span className="text-muted-foreground font-medium">Est. Completion:</span>
                <span className="text-sm font-semibold">
                  {new Date(process.estimatedCompletionDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {process.completedAt && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground font-medium">Completed:</span>
                <span className="text-sm font-semibold">
                  {new Date(process.completedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-order-info" className="lg:col-span-2 bg-gradient-to-br from-background to-green-50/30 dark:to-green-950/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Order Information</CardTitle>
                <CardDescription className="text-sm">Complete order details and customer information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {process.order ? (
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                  <TabsTrigger value="summary" data-testid="tab-order-summary" className="data-[state=active]:bg-background">Summary</TabsTrigger>
                  <TabsTrigger value="items" data-testid="tab-order-items" className="data-[state=active]:bg-background">Items</TabsTrigger>
                  <TabsTrigger value="address" data-testid="tab-address" className="data-[state=active]:bg-background">Address</TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="mt-4 space-y-4" data-testid="content-order-summary">
                  <div className="space-y-4">
                    {/* Basic Order Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order Number:</span>
                          <span className="text-sm font-mono">#{process.order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order Date:</span>
                          <span className="text-sm" data-testid="text-order-date">
                            {new Date(process.order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order Status:</span>
                          <Badge variant="outline" data-testid="badge-order-status">{process.order.status}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {process.order.customer && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span className="text-sm font-medium" data-testid="text-customer-name">
                              {process.order.customer.firstName} {process.order.customer.lastName}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Status:</span>
                          <Badge variant={process.order.paymentStatus === 'paid' ? 'default' : 'destructive'} data-testid="badge-payment-status">
                            {process.order.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Product Names */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Products</h4>
                      <div className="space-y-1">
                        {process.order.items.map((item, index) => (
                          <div key={item.id} className="text-sm text-muted-foreground">
                            • {item.productName} (Qty: {item.quantity})
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Shipping Information */}
                    {(process.order.trackingNumber || process.order.shippingCarrier || process.order.estimatedDeliveryDate) && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Shipping Information</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {process.order.trackingNumber && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tracking Number:</span>
                              <span className="font-mono" data-testid="text-tracking-number">{process.order.trackingNumber}</span>
                            </div>
                          )}
                          {process.order.shippingCarrier && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Carrier:</span>
                              <span data-testid="text-shipping-carrier">{process.order.shippingCarrier}</span>
                            </div>
                          )}
                          {process.order.estimatedDeliveryDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Est. Delivery:</span>
                              <span data-testid="text-estimated-delivery">
                                {new Date(process.order.estimatedDeliveryDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="items" className="mt-4 space-y-4" data-testid="content-order-items">
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Product Details ({process.order.items.length} item{process.order.items.length !== 1 ? 's' : ''})</h4>
                    <div className="space-y-6">
                      {process.order.items.map((item, index) => (
                        <Card key={item.id} className="p-6" data-testid={`item-${item.id}`}>
                          <div className="flex flex-col items-center space-y-6">
                            {/* Product Image - Centered at top */}
                            <div className="flex flex-col items-center space-y-3">
                              {item.productImage ? (
                                <img 
                                  src={item.productImage} 
                                  alt={item.productName}
                                  className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                                  data-testid={`img-product-${item.id}`}
                                />
                              ) : (
                                <div className="w-32 h-32 bg-muted rounded-lg border flex items-center justify-center">
                                  <Package className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs" data-testid={`badge-quantity-${item.id}`}>
                                Quantity: {item.quantity}
                              </Badge>
                            </div>
                            
                            {/* Product Information - Below image */}
                            <div className="w-full space-y-5">
                              {/* Product Header */}
                              <div className="text-center">
                                <h5 className="font-semibold text-xl mb-2" data-testid={`text-product-name-${item.id}`}>
                                  {item.productName}
                                </h5>
                                <div className="w-20 h-1 bg-primary rounded-full mx-auto"></div>
                              </div>
                              
                              {/* Product Specifications */}
                              {item.customConfiguration && (() => {
                                try {
                                  // Parse JSON string if it's a string, otherwise use as-is
                                  const config = typeof item.customConfiguration === 'string' 
                                    ? JSON.parse(item.customConfiguration) 
                                    : item.customConfiguration;
                                  
                                  return (
                                    <div className="space-y-4">
                                      <h6 className="font-medium text-sm text-muted-foreground text-center">Product Specifications</h6>
                                      <div className="space-y-3 max-w-md mx-auto">
                                        {config.color && (
                                          <div className="flex items-center justify-between py-2 border-b border-muted">
                                            <span className="text-sm font-medium text-muted-foreground">Color:</span>
                                            <div className="text-sm font-semibold" data-testid={`text-color-${item.id}`}>
                                              {config.color}
                                            </div>
                                          </div>
                                        )}
                                        {config.texture && (
                                          <div className="flex items-center justify-between py-2 border-b border-muted">
                                            <span className="text-sm font-medium text-muted-foreground">Texture:</span>
                                            <div className="text-sm font-semibold" data-testid={`text-texture-${item.id}`}>
                                              {config.texture}
                                            </div>
                                          </div>
                                        )}
                                        {config.dimensions && (
                                          <div className="flex items-center justify-between py-2 border-b border-muted">
                                            <span className="text-sm font-medium text-muted-foreground">Dimensions:</span>
                                            <div className="text-sm font-semibold text-right" data-testid={`text-dimensions-${item.id}`}>
                                              {typeof config.dimensions === 'object' 
                                                ? `${config.dimensions.width || 'N/A'} × ${config.dimensions.height || 'N/A'} × ${config.dimensions.depth || 'N/A'}`
                                                : config.dimensions}
                                            </div>
                                          </div>
                                        )}
                                        {config.material && (
                                          <div className="flex items-center justify-between py-2 border-b border-muted">
                                            <span className="text-sm font-medium text-muted-foreground">Material:</span>
                                            <div className="text-sm font-semibold" data-testid={`text-material-${item.id}`}>
                                              {config.material}
                                            </div>
                                          </div>
                                        )}
                                        {config.finish && (
                                          <div className="flex items-center justify-between py-2">
                                            <span className="text-sm font-medium text-muted-foreground">Finish:</span>
                                            <div className="text-sm font-semibold" data-testid={`text-finish-${item.id}`}>
                                              {config.finish}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                } catch (error) {
                                  // Fallback to raw display if JSON parsing fails
                                  return (
                                    <div className="mt-3 p-3 bg-muted rounded-lg max-w-md mx-auto">
                                      <span className="text-xs font-medium text-muted-foreground mb-2 block">Configuration Details:</span>
                                      <pre className="text-xs whitespace-pre-wrap text-muted-foreground" data-testid={`text-custom-config-${item.id}`}>
                                        {typeof item.customConfiguration === 'string' ? item.customConfiguration : JSON.stringify(item.customConfiguration, null, 2)}
                                      </pre>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="address" className="mt-4 space-y-3" data-testid="content-address">
                  {process.order.shippingAddress ? (
                    <Card className="p-6" data-testid="card-shipping-address">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-4 w-4 text-muted-foreground">📍</div>
                        <h4 className="font-medium">Shipping Address</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="font-medium" data-testid="text-shipping-name">
                          {process.order.shippingAddress.firstName} {process.order.shippingAddress.lastName}
                        </div>
                        <div data-testid="text-shipping-street">{process.order.shippingAddress.street}</div>
                        {process.order.shippingAddress.apartment && (
                          <div data-testid="text-shipping-apartment">{process.order.shippingAddress.apartment}</div>
                        )}
                        <div data-testid="text-shipping-location">
                          {process.order.shippingAddress.city}, {process.order.shippingAddress.state} {process.order.shippingAddress.postalCode}
                        </div>
                        <div data-testid="text-shipping-country">{process.order.shippingAddress.country}</div>
                        {process.order.shippingAddress.phone && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                            <span className="text-muted-foreground">Phone:</span>
                            <span data-testid="text-shipping-phone">{process.order.shippingAddress.phone}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-4xl mb-2">📍</div>
                      <p className="text-sm">No shipping address available</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-muted-foreground text-sm">Order information not available</p>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Process Notes */}
      {process.notes && (
        <Card data-testid="card-process-notes">
          <CardHeader>
            <CardTitle className="text-base">Process Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{process.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Manufacturing Progress Overview */}
      <Card data-testid="card-manufacturing-progress" className="bg-gradient-to-br from-background to-blue-50/30 dark:to-blue-950/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Manufacturing Progress Overview</CardTitle>
              <CardDescription className="text-sm">
                Visual progress tracking across all manufacturing stages
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ManufacturingProgressBar 
            stages={process.stages.map(stage => ({
              id: stage.id,
              name: stage.name,
              status: stage.status as 'not_started' | 'in_progress' | 'completed',
              position: stage.position
            }))}
            data-testid="manufacturing-progress-bar"
          />
        </CardContent>
      </Card>

      {/* Manufacturing Stages */}
      <Card data-testid="card-manufacturing-stages" className="bg-gradient-to-br from-background to-orange-50/30 dark:to-orange-950/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Manufacturing Stages</CardTitle>
              <CardDescription className="text-sm">
                Update progress and upload photos for each manufacturing stage
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-6">
            {process.stages
              .sort((a, b) => a.position - b.position)
              .map((stage) => (
                <Card key={stage.id} className="border-2 border-muted hover:border-muted-foreground/20 transition-colors" data-testid={`stage-${stage.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {stage.position}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {stage.name}
                          </CardTitle>
                          {stage.notes && (
                            <CardDescription className="text-xs mt-1">{stage.notes}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(stage.status)}
                        {getStatusBadge(stage.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {/* Stage Timeline */}
                    {stage.startedAt && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Started: {new Date(stage.startedAt).toLocaleDateString()}</span>
                        {stage.completedAt && (
                          <>
                            <span>•</span>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Completed: {new Date(stage.completedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Recent Updates Preview */}
                    {stage.updates && stage.updates.length > 0 && (
                      <div className="space-y-3">
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium mb-3 block">Recent Updates</Label>
                          <div className="space-y-3">
                            {stage.updates.slice(0, 2).map((update) => (
                              <UpdateCard
                                key={update.id}
                                update={update}
                                userRole="manufacturer"
                                data-testid={`update-${update.id}`}
                              />
                            ))}
                            {stage.updates.length > 2 && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedStageId(stage.id)}
                                data-testid={`button-view-all-updates-${stage.id}`}
                              >
                                View all {stage.updates.length} updates
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add Update Form */}
                    <div className="space-y-3">
                      <Separator />
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                          <Camera className="h-4 w-4 text-primary" />
                          Add Progress Update
                        </Label>
                        <StageUpdateComposer
                          processId={process.id}
                          stageId={stage.id}
                          userRole="manufacturer"
                          placeholder={`Share progress on ${stage.name.toLowerCase()}... Upload photos to show current state!`}
                          compact={true}
                          showTitle={false}
                          data-testid={`update-composer-${stage.id}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Timeline */}
      <Card data-testid="card-timeline" className="bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Manufacturing Timeline</CardTitle>
              <CardDescription className="text-sm">
                Complete process timeline with all updates and activities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Timeline 
            process={process}
            userRole="manufacturer"
            data-testid="process-timeline"
          />
        </CardContent>
      </Card>

      {/* Stage Status Update Modal */}
      {stageStatusUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="modal-stage-status-update">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Update Stage Status</CardTitle>
              <CardDescription>
                Confirm the status change for this manufacturing stage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>New Status</Label>
                <div className="mt-1">
                  {getStatusBadge(stageStatusUpdate.status)}
                </div>
              </div>
              <div>
                <Label htmlFor="update-notes">Notes (optional)</Label>
                <Textarea
                  id="update-notes"
                  placeholder="Add any notes about this status change..."
                  value={stageStatusUpdate.notes}
                  onChange={(e) => setStageStatusUpdate({
                    ...stageStatusUpdate,
                    notes: e.target.value
                  })}
                  data-testid="textarea-update-notes"
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button 
                variant="outline" 
                onClick={() => setStageStatusUpdate(null)}
                data-testid="button-cancel-status-update"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmStageStatusUpdate}
                disabled={updateStageMutation.isPending}
                data-testid="button-confirm-status-update"
              >
                {updateStageMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}