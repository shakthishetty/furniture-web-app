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
  Upload
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
    orderNumber: string;
    userId: string;
    status: string;
    totalAmount: string;
    createdAt: string;
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
      toast({
        title: "Error",
        description: error.message || "Failed to update stage status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "blocked":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Blocked</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-600" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
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
      <div className="grid gap-6 md:grid-cols-3">
        <Card data-testid="card-process-info">
          <CardHeader>
            <CardTitle className="text-base">Process Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                {getStatusIcon(process.status)}
                {getStatusBadge(process.status)}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started:</span>
              <span className="text-sm">
                {process.startedAt ? new Date(process.startedAt).toLocaleDateString() : 'Not started'}
              </span>
            </div>
            {process.estimatedCompletionDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Completion:</span>
                <span className="text-sm">
                  {new Date(process.estimatedCompletionDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {process.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span className="text-sm">
                  {new Date(process.completedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-order-info">
          <CardHeader>
            <CardTitle className="text-base">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {process.order ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="text-sm font-mono">#{process.order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Status:</span>
                  <Badge variant="outline">{process.order.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span className="text-sm">
                    {new Date(process.order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="text-sm font-medium">${process.order.totalAmount}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Order information not available</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-progress-info">
          <CardHeader>
            <CardTitle className="text-base">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion</span>
                <span>{process.stages.filter(s => s.status === 'completed').length}/{process.stages.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${(process.stages.filter(s => s.status === 'completed').length / process.stages.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-medium text-blue-600">
                  {process.stages.filter(s => s.status === 'in_progress').length}
                </div>
                <div className="text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-medium text-green-600">
                  {process.stages.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
            </div>
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

      {/* Stages and Timeline */}
      <Tabs defaultValue="timeline" className="space-y-4" data-testid="tabs-process-detail">
        <TabsList>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="stages" data-testid="tab-stages">Stages</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card data-testid="card-timeline">
            <CardHeader>
              <CardTitle>Manufacturing Timeline</CardTitle>
              <CardDescription>
                Complete process timeline with all updates and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline 
                process={process}
                userRole="manufacturer"
                data-testid="process-timeline"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <div className="grid gap-4">
            {process.stages
              .sort((a, b) => a.position - b.position)
              .map((stage) => (
                <Card key={stage.id} data-testid={`stage-${stage.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">
                          {stage.position}. {stage.name}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(stage.status)}
                          {getStatusBadge(stage.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={stage.status} 
                          onValueChange={(value) => handleStageStatusChange(stage.id, value)}
                          disabled={updateStageMutation.isPending}
                        >
                          <SelectTrigger className="w-40" data-testid={`select-stage-status-${stage.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {stage.notes && (
                      <CardDescription>{stage.notes}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stage Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {stage.startedAt && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Started</Label>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(stage.startedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      {stage.completedAt && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Completed</Label>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>{new Date(stage.completedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stage Updates */}
                    {stage.updates && stage.updates.length > 0 && (
                      <div className="space-y-3">
                        <Separator />
                        <div>
                          <Label className="text-sm font-medium mb-3 block">Updates</Label>
                          <div className="space-y-3">
                            {stage.updates.slice(0, 3).map((update) => (
                              <UpdateCard
                                key={update.id}
                                update={update}
                                userRole="manufacturer"
                                data-testid={`update-${update.id}`}
                              />
                            ))}
                            {stage.updates.length > 3 && (
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
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Add Update</Label>
                        <StageUpdateComposer
                          processId={process.id}
                          stageId={stage.id}
                          userRole="manufacturer"
                          data-testid={`update-composer-${stage.id}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

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