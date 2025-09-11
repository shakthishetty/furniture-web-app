import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Plus, 
  Eye, 
  Edit3, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Camera,
  MessageSquare,
  Calendar,
  User
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
  stages: ManufacturingStage[];
}

interface ManufacturingStage {
  id: string;
  processId: string;
  name: string;
  description?: string;
  status: string;
  sortOrder: number;
  estimatedDuration?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  updates: StageUpdate[];
}

interface StageUpdate {
  id: string;
  stageId: string;
  title: string;
  content: string;
  isInternal: boolean;
  authorUserId: string;
  authorRole: string;
  createdAt: string;
  photos: StageUpdatePhoto[];
  replies: StageUpdateReply[];
}

interface StageUpdatePhoto {
  id: string;
  updateId: string;
  imageUrl: string;
  description?: string;
  createdAt: string;
}

interface StageUpdateReply {
  id: string;
  updateId: string;
  content: string;
  authorUserId: string;
  authorRole: string;
  createdAt: string;
}

interface ProcessesResponse {
  processes: ManufacturingProcess[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminManufacturing() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProcess, setSelectedProcess] = useState<ManufacturingProcess | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProcessOrderId, setNewProcessOrderId] = useState("");
  const { toast } = useToast();
  const limit = 20;

  const { data: processesData, isLoading } = useQuery<ProcessesResponse>({
    queryKey: ["/api/admin/manufacturing/processes", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await apiRequest("GET", `/api/admin/manufacturing/processes?${params.toString()}`);
      return response.json();
    },
  });

  const createProcessMutation = useMutation({
    mutationFn: async (data: { orderId: string }) => {
      const response = await apiRequest("POST", "/api/admin/manufacturing/processes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing/processes"] });
      toast({
        title: "Success",
        description: "Manufacturing process created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewProcessOrderId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create manufacturing process",
        variant: "destructive",
      });
    },
  });

  const handleViewProcess = async (processId: string) => {
    try {
      const response = await apiRequest("GET", `/api/admin/manufacturing/processes/${processId}`);
      const process = await response.json();
      setSelectedProcess(process);
      setIsViewDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load process details",
        variant: "destructive",
      });
    }
  };

  const handleCreateProcess = () => {
    if (!newProcessOrderId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order ID",
        variant: "destructive",
      });
      return;
    }
    createProcessMutation.mutate({ orderId: newProcessOrderId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "on_hold":
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">On Hold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Clock className="h-3 w-3" />;
      case "in_progress":
        return <Settings className="h-3 w-3 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "on_hold":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-manufacturing-title">
            Manufacturing Tracking
          </h1>
          <p className="text-muted-foreground" data-testid="text-manufacturing-description">
            Monitor and manage furniture manufacturing processes
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-process"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Process
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Manufacturing Processes Table */}
      <Card data-testid="card-processes">
        <CardHeader>
          <CardTitle>Manufacturing Processes</CardTitle>
          <CardDescription>
            {processesData?.total || 0} total processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Order ID</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Start Date</th>
                      <th className="text-left py-2">Est. Completion</th>
                      <th className="text-left py-2">Stages</th>
                      <th className="text-center py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processesData?.processes.map((process) => (
                      <tr key={process.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 font-mono text-sm">{process.orderId}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(process.status)}
                            {getStatusBadge(process.status)}
                          </div>
                        </td>
                        <td className="py-3 text-sm">
                          {new Date(process.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-sm">
                          {process.estimatedCompletionDate 
                            ? new Date(process.estimatedCompletionDate).toLocaleDateString()
                            : "Not set"
                          }
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">
                            {process.stages?.length || 0} stages
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProcess(process.id)}
                            data-testid={`button-view-process-${process.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(!processesData?.processes || processesData.processes.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No manufacturing processes found
                </div>
              )}

              {/* Pagination */}
              {processesData && processesData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {processesData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === processesData.totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Process Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-process">
          <DialogHeader>
            <DialogTitle>Create Manufacturing Process</DialogTitle>
            <DialogDescription>
              Start a new manufacturing process for an order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="order-id">Order ID</Label>
              <Input
                id="order-id"
                value={newProcessOrderId}
                onChange={(e) => setNewProcessOrderId(e.target.value)}
                placeholder="Enter order ID"
                data-testid="input-order-id"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProcess}
              disabled={createProcessMutation.isPending || !newProcessOrderId.trim()}
              data-testid="button-confirm-create"
            >
              {createProcessMutation.isPending ? "Creating..." : "Create Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Process Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="dialog-view-process">
          <DialogHeader>
            <DialogTitle>Manufacturing Process Details</DialogTitle>
            <DialogDescription>
              {selectedProcess && `Order ID: ${selectedProcess.orderId}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcess && (
            <div className="space-y-6">
              {/* Process Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedProcess.status)}
                      {getStatusBadge(selectedProcess.status)}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p className="mt-1 text-sm">
                    {new Date(selectedProcess.startDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedProcess.estimatedCompletionDate && (
                  <div>
                    <Label>Estimated Completion</Label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedProcess.estimatedCompletionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedProcess.actualCompletionDate && (
                  <div>
                    <Label>Actual Completion</Label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedProcess.actualCompletionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedProcess.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="mt-1 text-sm bg-muted p-3 rounded">
                    {selectedProcess.notes}
                  </p>
                </div>
              )}

              <Separator />

              {/* Manufacturing Stages */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Manufacturing Stages</h3>
                <div className="space-y-4">
                  {selectedProcess.stages?.map((stage, index) => (
                    <Card key={stage.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {index + 1}. {stage.name}
                          </CardTitle>
                          {getStatusBadge(stage.status)}
                        </div>
                        {stage.description && (
                          <CardDescription>{stage.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {stage.startDate && (
                            <div>
                              <Label className="text-xs">Start Date</Label>
                              <p className="text-sm">
                                {new Date(stage.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {stage.endDate && (
                            <div>
                              <Label className="text-xs">End Date</Label>
                              <p className="text-sm">
                                {new Date(stage.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Stage Updates */}
                        {stage.updates && stage.updates.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Recent Updates</Label>
                            <div className="mt-2 space-y-2">
                              {stage.updates.slice(0, 3).map((update) => (
                                <div key={update.id} className="border rounded p-3 text-sm">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">{update.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      {update.authorRole}
                                      {update.isInternal && (
                                        <Badge variant="secondary" className="text-xs">Internal</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground">{update.content}</p>
                                  {update.photos && update.photos.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                      <Camera className="h-3 w-3" />
                                      {update.photos.length} photo(s)
                                    </div>
                                  )}
                                  {update.replies && update.replies.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                      <MessageSquare className="h-3 w-3" />
                                      {update.replies.length} reply(ies)
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(update.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}