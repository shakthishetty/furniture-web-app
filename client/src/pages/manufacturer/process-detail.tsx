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
  useManufacturingSSE,
  ProductCustomizationDetail
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
  Camera,
  Lock,
  LockOpen
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
        isCustomerQuestion: boolean | null;
        isCustomerServiceReply: boolean | null;
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

  const submitForApprovalMutation = useMutation({
    mutationFn: async (stageId: string) => {
      const response = await apiRequest(
        "POST", 
        `/api/manufacturer/processes/${processId}/stages/${stageId}/submit-for-approval`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/processes", processId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer/processes"] });
      toast({
        title: "Success",
        description: "Stage submitted for approval successfully",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to submit stage for approval";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
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
      case "approved":
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Approved</Badge>;
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
      case "approved":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const canSubmitForApproval = (stage: any) => {
    // Stage must be completed to submit for approval
    if (stage.status !== 'completed') return false;
    
    // Check if stage has required photos and updates
    const hasPhotos = stage.updates?.some((update: any) => 
      update.photos && update.photos.length > 0
    );
    const hasUpdates = stage.updates?.some((update: any) => 
      update.message && update.message.trim().length > 0 && !update.isInternal
    );
    
    return hasPhotos && hasUpdates;
  };

  const getNextSubmittableStage = () => {
    if (!process?.stages) return null;
    
    const sortedStages = [...process.stages].sort((a, b) => a.position - b.position);
    
    // Find the first stage that can be submitted sequentially
    for (const stage of sortedStages) {
      if (stage.status === 'completed' && canSubmitForApproval(stage) && isSequentialSubmissionAllowed(stage)) {
        return stage;
      }
      // If we hit a stage that's not approved, stop sequential search
      if (stage.status !== 'approved') {
        break;
      }
    }
    return null;
  };

  const isSequentialSubmissionAllowed = (stage: any) => {
    if (!process?.stages) return false;
    
    const sortedStages = [...process.stages].sort((a, b) => a.position - b.position);
    const currentStageIndex = sortedStages.findIndex(s => s.id === stage.id);
    
    // First stage can always be submitted if ready
    if (currentStageIndex === 0) return canSubmitForApproval(stage);
    
    // Check that all previous stages are fully approved
    for (let i = 0; i < currentStageIndex; i++) {
      const prevStage = sortedStages[i];
      // Only allow submission if ALL previous stages are approved
      if (prevStage.status !== 'approved') {
        return false;
      }
    }
    
    return canSubmitForApproval(stage);
  };

  const isStageUnlocked = (stage: any) => {
    if (!process?.stages) return false;
    
    // Stages that are awaiting approval or approved cannot be edited
    if (stage.status === 'awaiting_approval' || stage.status === 'approved') {
      return false;
    }
    
    const sortedStages = [...process.stages].sort((a, b) => a.position - b.position);
    const currentStageIndex = sortedStages.findIndex(s => s.id === stage.id);
    
    // First stage is always unlocked (unless awaiting approval or approved)
    if (currentStageIndex === 0) return true;
    
    // For subsequent stages, check if previous stage is approved
    const prevStage = sortedStages[currentStageIndex - 1];
    return prevStage.status === 'approved';
  };

  const getStageUnlockMessage = (stage: any) => {
    if (!process?.stages) return "";
    
    // Special message for stages awaiting approval or approved
    if (stage.status === 'awaiting_approval') {
      return "This stage is awaiting admin approval. You cannot make changes until it's approved or rejected.";
    }
    if (stage.status === 'approved') {
      return "This stage has been approved and is now locked. All work on this stage is complete.";
    }
    
    const sortedStages = [...process.stages].sort((a, b) => a.position - b.position);
    const currentStageIndex = sortedStages.findIndex(s => s.id === stage.id);
    
    if (currentStageIndex === 0) return "";
    
    const prevStage = sortedStages[currentStageIndex - 1];
    
    if (prevStage.status === 'approved') {
      return "";
    } else if (prevStage.status === 'awaiting_approval') {
      return `Waiting for admin approval on "${prevStage.name}" before you can start this stage.`;
    } else if (prevStage.status === 'rejected') {
      return `"${prevStage.name}" was rejected and needs to be resubmitted before you can start this stage.`;
    } else {
      return `Complete and get approval for "${prevStage.name}" before starting this stage.`;
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

  const handleSubmitForApproval = (stageId: string) => {
    submitForApprovalMutation.mutate(stageId);
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
            <Link href="~/manufacturer/processes">
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
          <Link href="~/manufacturer/processes">
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
                
                <TabsContent value="summary" className="mt-4 space-y-6" data-testid="content-order-summary">
                  <div className="space-y-6">
                    {/* Enhanced Order Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-muted">
                          <span className="text-muted-foreground font-medium">Order Number:</span>
                          <span className="text-sm font-mono font-semibold bg-muted px-2 py-1 rounded">#{process.order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-muted">
                          <span className="text-muted-foreground font-medium">Order Date:</span>
                          <span className="text-sm font-semibold" data-testid="text-order-date">
                            {new Date(process.order.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-muted-foreground font-medium">Order Status:</span>
                          <Badge 
                            variant={process.order.status === 'completed' ? 'default' : 'secondary'} 
                            data-testid="badge-order-status"
                            className="capitalize"
                          >
                            {process.order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Right Column */}
                      <div className="space-y-4">
                        {process.order.customer && (
                          <div className="flex justify-between items-center py-3 border-b border-muted">
                            <span className="text-muted-foreground font-medium">Customer:</span>
                            <span className="text-sm font-semibold" data-testid="text-customer-name">
                              {process.order.customer.firstName} {process.order.customer.lastName}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-3 border-b border-muted">
                          <span className="text-muted-foreground font-medium">Payment Status:</span>
                          <Badge 
                            variant={process.order.paymentStatus === 'paid' ? 'default' : 'destructive'} 
                            data-testid="badge-payment-status"
                            className="capitalize"
                          >
                            {process.order.paymentStatus}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-muted-foreground font-medium">Total Amount:</span>
                          <span className="text-sm font-semibold">
                            ${process.order.totalAmount || '0.00'}
                          </span>
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
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-lg">Product Details</h4>
                      <Badge variant="outline" className="font-semibold">
                        {process.order.items.length} item{process.order.items.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-6">
                      {process.order?.items.map((item) => (
                        <ProductCustomizationDetail 
                          key={item.id} 
                          item={item} 
                          updatedAt={process.order?.updatedAt}
                        />
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
            {[...process.stages]
              .sort((a, b) => a.position - b.position)
              .map((stage) => (
                <Card key={stage.id} className={`border-2 transition-colors ${
                  !isStageUnlocked(stage) 
                    ? 'border-muted bg-muted/20 opacity-75' 
                    : 'border-muted hover:border-muted-foreground/20'
                }`} data-testid={`stage-${stage.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                          !isStageUnlocked(stage)
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {stage.position}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold">
                              {stage.name}
                            </CardTitle>
                            {!isStageUnlocked(stage) && (
                              <span title="Stage locked">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              </span>
                            )}
                            {isStageUnlocked(stage) && stage.status !== 'approved' && stage.position > 1 && (
                              <span title="Stage unlocked">
                                <LockOpen className="h-4 w-4 text-green-600" />
                              </span>
                            )}
                          </div>
                          {stage.notes && (
                            <CardDescription className="text-xs mt-1">{stage.notes}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(stage.status)}
                        {getStatusBadge(stage.status)}
                        
                        {/* Start Stage Button for Pending Stages */}
                        {stage.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStageStatusChange(stage.id, 'in_progress')}
                            disabled={updateStageMutation.isPending || !isStageUnlocked(stage)}
                            className={`ml-2 ${
                              isStageUnlocked(stage)
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={!isStageUnlocked(stage) ? "Complete previous stage first" : "Start working on this stage"}
                            data-testid={`button-start-stage-${stage.id}`}
                          >
                            {updateStageMutation.isPending ? "Starting..." : "Start Stage"}
                          </Button>
                        )}

                        {/* Complete Stage Button for In Progress Stages */}
                        {stage.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleStageStatusChange(stage.id, 'completed')}
                            disabled={updateStageMutation.isPending || !isStageUnlocked(stage)}
                            className={`ml-2 ${
                              isStageUnlocked(stage)
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={!isStageUnlocked(stage) ? "Stage is locked" : "Mark this stage as completed"}
                            data-testid={`button-complete-stage-${stage.id}`}
                          >
                            {updateStageMutation.isPending ? "Completing..." : "Complete Stage"}
                          </Button>
                        )}

                        {/* Submission Button for Completed Stages (not yet approved) */}
                        {stage.status === 'completed' && !stage.approvedAt && (
                          <Button 
                            size="sm" 
                            onClick={() => handleSubmitForApproval(stage.id)}
                            disabled={submitForApprovalMutation.isPending || !isSequentialSubmissionAllowed(stage)}
                            className={`ml-2 ${
                              isSequentialSubmissionAllowed(stage) 
                                ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            title={
                              !isSequentialSubmissionAllowed(stage) 
                                ? !canSubmitForApproval(stage)
                                  ? "Please add photos and progress updates before submitting"
                                  : "Previous stages must be approved first"
                                : "Submit this stage for admin approval"
                            }
                            data-testid={`button-submit-approval-${stage.id}`}
                          >
                            {submitForApprovalMutation.isPending ? "Submitting..." : "Submit for Approval"}
                          </Button>
                        )}
                        
                        {/* Rejection Notice */}
                        {stage.status === 'rejected' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedStageId(stage.id)}
                            className="ml-2 border-red-200 text-red-700 hover:bg-red-50"
                            data-testid={`button-view-rejection-${stage.id}`}
                          >
                            View Rejection Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {/* Stage Locked Warning */}
                    {!isStageUnlocked(stage) && (
                      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Lock className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Stage Locked</h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {getStageUnlockMessage(stage)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
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

                    {/* Rejection Details */}
                    {stage.status === 'rejected' && stage.rejectionReason && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                              <h4 className="font-medium text-red-900 dark:text-red-100">Stage Rejected</h4>
                              <p className="text-sm text-red-800 dark:text-red-200">{stage.rejectionReason}</p>
                              {stage.rejectedAt && (
                                <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                                  <Calendar className="h-3 w-3" />
                                  <span>Rejected on {new Date(stage.rejectedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                              <div className="pt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleStageStatusChange(stage.id, 'in_progress')}
                                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                                  data-testid={`button-restart-stage-${stage.id}`}
                                >
                                  Restart Stage
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submission Requirements for Completed Stages */}
                    {stage.status === 'completed' && !canSubmitForApproval(stage) && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Submission Requirements</h4>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                Before submitting for approval, please ensure:
                              </p>
                              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 ml-4">
                                <li>• At least one photo showing progress</li>
                                <li>• Detailed progress update describing work completed</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sequential Workflow Notice */}
                    {stage.status === 'completed' && canSubmitForApproval(stage) && !isSequentialSubmissionAllowed(stage) && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                              <h4 className="font-medium text-blue-900 dark:text-blue-100">Awaiting Previous Stages</h4>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                This stage must wait for all previous stages to be approved before submission.
                              </p>
                            </div>
                          </div>
                        </div>
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
                                update={{ ...update, stageName: stage.name }}
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
                    {isStageUnlocked(stage) ? (
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
                    ) : (
                      <div className="space-y-3">
                        <Separator />
                        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Lock className="h-4 w-4" />
                            <span className="text-sm font-medium">Progress updates locked until previous stage is approved</span>
                          </div>
                        </div>
                      </div>
                    )}
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