import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Timeline, 
  UpdateCard, 
  PhotoGrid, 
  ReplyThread, 
  StageUpdateComposer,
  useManufacturerDashboardSSE
} from "@/components/manufacturing";
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
  User,
  Search,
  Filter,
  UserCheck,
  UserX,
  RefreshCw,
  MoreHorizontal,
  Download,
  Upload,
  X,
  Send,
  Building,
  TrendingUp,
  Activity,
  Users,
  FileText
} from "lucide-react";
import type { 
  ManufacturingProcess, 
  ManufacturingStage, 
  StageUpdate, 
  User as UserType,
  Manufacturer
} from "@shared/schema";

interface ProcessesResponse {
  processes: (ManufacturingProcess & {
    assignedManufacturerId?: string | null;
    assignedManufacturer?: Manufacturer | null;
    stages?: ManufacturingStage[];
    order?: {
      orderNumber: string;
      userId: string;
      status: string;
      totalAmount?: string;
    };
  })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


interface ProcessDetailsWithFullData extends ManufacturingProcess {
  assignedManufacturer?: Manufacturer | null;
  stages: (ManufacturingStage & {
    updates?: StageUpdate[];
  })[];
  order?: {
    orderNumber: string;
    userId: string;
    status: string;
    totalAmount?: string;
    createdAt: string;
  };
}

interface DashboardStats {
  totalProcesses: number;
  activeProcesses: number;
  completedProcesses: number;
  pendingProcesses: number;
  pausedProcesses: number;
  unassignedProcesses: number;
  averageCompletionTime: number;
}

export default function AdminManufacturing() {
  // State management
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<Set<string>>(new Set());
  const [selectedProcess, setSelectedProcess] = useState<ProcessDetailsWithFullData | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreateStageDialogOpen, setIsCreateStageDialogOpen] = useState(false);
  const [newProcessOrderId, setNewProcessOrderId] = useState("");
  const [assignmentProcessId, setAssignmentProcessId] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [selectedStageForUpdate, setSelectedStageForUpdate] = useState<ManufacturingStage | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");
  const [newStageEstimatedDuration, setNewStageEstimatedDuration] = useState("");
  const { toast } = useToast();
  const limit = 20;

  // Real-time updates
  const sseState = useManufacturerDashboardSSE("admin", {
    showToastNotifications: true,
    onMessage: (message) => {
      console.log('SSE message received:', message);
    }
  });

  // Data fetching
  const { data: processesData, isLoading, refetch: refetchProcesses } = useQuery<ProcessesResponse>({
    queryKey: ["/api/admin/manufacturing/processes", page, statusFilter, manufacturerFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (manufacturerFilter !== "all") {
        if (manufacturerFilter === "assigned") {
          params.append("hasManufacturer", "true");
        } else if (manufacturerFilter === "unassigned") {
          params.append("hasManufacturer", "false");
        } else {
          params.append("manufacturerId", manufacturerFilter);
        }
      }
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const response = await apiRequest("GET", `/api/admin/manufacturing/processes?${params.toString()}`);
      return response.json();
    },
  });

  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/admin/direct-manufacturers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/direct-manufacturers");
      return response.json();
    },
  });

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/manufacturing/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/manufacturing/stats");
      return response.json();
    },
  });

  // Mutations
  const createProcessMutation = useMutation({
    mutationFn: async (data: { orderId: string }) => {
      const response = await apiRequest("POST", "/api/admin/manufacturing/processes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing/stats"] });
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

  const assignManufacturerMutation = useMutation({
    mutationFn: async ({ processId, manufacturerId }: { processId: string; manufacturerId: string | null }) => {
      const response = await apiRequest("POST", `/api/admin/manufacturing/processes/${processId}/assign`, {
        manufacturerId
      });
      return response.json();
    },
    onMutate: async ({ processId, manufacturerId }) => {
      // Cancel any outgoing refetches for all possible query key variations
      await queryClient.cancelQueries({ queryKey: ["/api/admin/manufacturing/processes"] });
      
      // Get manufacturer data
      const manufacturer = manufacturerId ? manufacturers.find(m => m.id === manufacturerId) : null;
      
      // Snapshot all current cache entries
      const previousData = queryClient.getQueriesData({ queryKey: ["/api/admin/manufacturing/processes"] });
      
      // Update all cache entries optimistically
      queryClient.setQueriesData(
        { queryKey: ["/api/admin/manufacturing/processes"] },
        (old: ProcessesResponse | undefined) => {
          if (!old) return old;
          
          return {
            ...old,
            processes: old.processes.map(process =>
              process.id === processId
                ? { 
                    ...process, 
                    assignedManufacturerId: manufacturerId,
                    assignedManufacturer: manufacturer 
                  }
                : process
            )
          };
        }
      );
      
      return { previousData };
    },
    onSuccess: (data, { manufacturerId }) => {
      const manufacturer = manufacturerId ? manufacturers.find(m => m.id === manufacturerId) : null;
      
      toast({
        title: "Success",
        description: manufacturer 
          ? `Successfully assigned to ${manufacturer.name}`
          : "Successfully unassigned manufacturer",
      });
      setIsAssignDialogOpen(false);
      setAssignmentProcessId(null);
      setSelectedManufacturer("");
      
      // Invalidate queries immediately to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing/stats"] });
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, restore all previous cache entries
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to assign manufacturer",
        variant: "destructive",
      });
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ processIds, manufacturerId }: { processIds: string[]; manufacturerId: string | null }) => {
      await Promise.all(
        processIds.map(processId => 
          apiRequest("POST", `/api/admin/manufacturing/processes/${processId}/assign`, {
            manufacturerId
          })
        )
      );
    },
    onSuccess: (_, { processIds }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing/stats"] });
      toast({
        title: "Success",
        description: `Successfully updated ${processIds.length} process assignments`,
      });
      setSelectedProcesses(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to bulk assign manufacturers",
        variant: "destructive",
      });
    },
  });

  const createStageMutation = useMutation({
    mutationFn: async (data: { processId: string; name: string; description?: string; estimatedDuration?: number }) => {
      const response = await apiRequest("POST", `/api/admin/manufacturing/processes/${data.processId}/stages`, {
        name: data.name,
        description: data.description,
        estimatedDuration: data.estimatedDuration
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturing/processes"] });
      toast({
        title: "Success",
        description: "Stage created successfully",
      });
      setIsCreateStageDialogOpen(false);
      setNewStageName("");
      setNewStageDescription("");
      setNewStageEstimatedDuration("");
      // Refresh the selected process if viewing details
      if (selectedProcess) {
        handleViewProcess(selectedProcess.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create stage",
        variant: "destructive",
      });
    },
  });

  // Event handlers
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

  const handleAssignManufacturer = (processId: string, currentManufacturerId?: string) => {
    setAssignmentProcessId(processId);
    setSelectedManufacturer(currentManufacturerId || "");
    setIsAssignDialogOpen(true);
  };

  const handleBulkAssign = (manufacturerId: string | null) => {
    const processIds = Array.from(selectedProcesses);
    if (processIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select processes to assign",
        variant: "destructive",
      });
      return;
    }
    bulkAssignMutation.mutate({ processIds, manufacturerId });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allProcessIds = new Set(processesData?.processes.map(p => p.id) || []);
      setSelectedProcesses(allProcessIds);
    } else {
      setSelectedProcesses(new Set());
    }
  };

  const handleSelectProcess = (processId: string, checked: boolean) => {
    const newSelected = new Set(selectedProcesses);
    if (checked) {
      newSelected.add(processId);
    } else {
      newSelected.delete(processId);
    }
    setSelectedProcesses(newSelected);
  };

  const handleUpdateReply = async (updateId: string, content: string) => {
    if (!selectedProcess) return;
    
    try {
      await apiRequest("POST", `/api/admin/manufacturing/updates/${updateId}/replies`, {
        content
      });
      
      // Refresh the process details
      handleViewProcess(selectedProcess.id);
      
      toast({
        title: "Success",
        description: "Reply posted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    }
  };

  const handleStageClick = (stage: ManufacturingStage) => {
    setSelectedStageForUpdate(stage);
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

  const handleCreateStage = () => {
    if (!selectedProcess || !newStageName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stage name",
        variant: "destructive",
      });
      return;
    }
    
    const estimatedDuration = newStageEstimatedDuration ? parseFloat(newStageEstimatedDuration) : undefined;
    
    createStageMutation.mutate({
      processId: selectedProcess.id,
      name: newStageName,
      description: newStageDescription || undefined,
      estimatedDuration
    });
  };

  // Auto-refresh every 30 seconds, but pause during mutations
  useEffect(() => {
    const interval = setInterval(() => {
      // Don't auto-refresh if a mutation is in progress
      if (!assignManufacturerMutation.isPending && !bulkAssignMutation.isPending) {
        refetchProcesses();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchProcesses, assignManufacturerMutation.isPending, bulkAssignMutation.isPending]);

  // Utility functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Not Started</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case "paused":
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Paused</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case "in_progress":
        return <Settings className="h-3 w-3 text-blue-600 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "paused":
        return <AlertCircle className="h-3 w-3 text-yellow-600" />;
      case "pending":
        return <Clock className="h-3 w-3 text-orange-600" />;
      default:
        return <Package className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getManufacturerDisplay = (process: ProcessesResponse['processes'][0]) => {
    // Use ID-first approach to find manufacturer
    const manufacturerId = process.assignedManufacturerId || process.assignedManufacturer?.id || "";
    const manufacturer = manufacturerId ? manufacturers.find(m => m.id === manufacturerId) : null;
    
    if (!manufacturer) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <UserX className="h-3 w-3" />
          <span className="text-xs">Unassigned</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <UserCheck className="h-3 w-3 text-green-600" />
        <span className="text-xs font-medium">
          {manufacturer.name}
        </span>
      </div>
    );
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const allProcessesSelected = processesData?.processes && processesData.processes.length > 0 && 
    processesData.processes.every(p => selectedProcesses.has(p.id));
  const someProcessesSelected = selectedProcesses.size > 0;

  const filteredProcesses = processesData?.processes || [];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-manufacturing-title">
              Manufacturing Management
            </h1>
            <p className="text-muted-foreground" data-testid="text-manufacturing-description">
              Monitor, assign, and manage furniture manufacturing processes
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

        {/* Dashboard Stats */}
        {dashboardStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.totalProcesses}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.activeProcesses}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.completedProcesses}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.pendingProcesses}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.unassignedProcesses}</p>
                    <p className="text-xs text-muted-foreground">Unassigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.averageCompletionTime}</p>
                    <p className="text-xs text-muted-foreground">Avg Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Enhanced Filters and Actions */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex items-center gap-2 min-w-[300px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or process details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              data-testid="search-processes"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter">Status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Manufacturer Filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="manufacturer-filter">Manufacturer:</Label>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-manufacturer-filter">
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <Separator />
                {manufacturers.map((manufacturer) => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchProcesses()}
            disabled={isLoading}
            data-testid="refresh-processes"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Bulk Actions */}
        {someProcessesSelected && (
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">
              {selectedProcesses.size} process{selectedProcesses.size === 1 ? '' : 'es'} selected
            </span>
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => handleBulkAssign(value === 'unassign' ? null : value)}>
                <SelectTrigger className="w-[200px]" data-testid="bulk-assign-select">
                  <SelectValue placeholder="Bulk assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">Unassign all</SelectItem>
                  <Separator />
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProcesses(new Set())}
                data-testid="clear-selection"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
        
        {/* SSE Connection Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${sseState.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Real-time updates {sseState.isConnected ? 'connected' : 'disconnected'}</span>
          {sseState.error && (
            <span className="text-red-500">({sseState.error})</span>
          )}
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
                      <th className="text-left py-2 w-12">
                        <Checkbox
                          checked={allProcessesSelected}
                          onCheckedChange={handleSelectAll}
                          data-testid="select-all-processes"
                        />
                      </th>
                      <th className="text-left py-2">Order ID</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Manufacturer</th>
                      <th className="text-left py-2">Progress</th>
                      <th className="text-left py-2">Start Date</th>
                      <th className="text-left py-2">Est. Completion</th>
                      <th className="text-center py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProcesses.map((process) => {
                      const stageProgress = process.stages ? {
                        total: process.stages.length,
                        completed: process.stages.filter(s => s.status === 'completed').length
                      } : { total: 0, completed: 0 };
                      const progressPercentage = stageProgress.total > 0 
                        ? Math.round((stageProgress.completed / stageProgress.total) * 100) 
                        : 0;
                      
                      return (
                        <tr key={process.id} className="border-b hover:bg-muted/50">
                          <td className="py-3">
                            <Checkbox
                              checked={selectedProcesses.has(process.id)}
                              onCheckedChange={(checked) => handleSelectProcess(process.id, checked as boolean)}
                              data-testid={`select-process-${process.id}`}
                            />
                          </td>
                          <td className="py-3 font-mono text-sm">
                            <div>
                              <div className="font-medium">{process.orderId}</div>
                              {process.order && (
                                <div className="text-xs text-muted-foreground">
                                  Order #{process.order.orderNumber}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(process.status)}
                              {getStatusBadge(process.status)}
                            </div>
                          </td>
                          <td className="py-3">
                            <Select 
                              value={process.assignedManufacturerId || process.assignedManufacturer?.id || "unassigned"} 
                              onValueChange={(manufacturerId) => {
                                assignManufacturerMutation.mutate({
                                  processId: process.id,
                                  manufacturerId: manufacturerId === "unassigned" ? null : manufacturerId
                                });
                              }}
                              disabled={assignManufacturerMutation.isPending}
                            >
                              <SelectTrigger 
                                className="w-[200px] h-8 text-xs"
                                data-testid={`manufacturer-dropdown-${process.id}`}
                              >
                                <SelectValue placeholder="Select manufacturer">
                                  {(() => {
                                    const manufacturerId = process.assignedManufacturerId || process.assignedManufacturer?.id || "";
                                    const manufacturer = manufacturerId ? manufacturers.find(m => m.id === manufacturerId) : null;
                                    
                                    return manufacturer ? (
                                      <div className="flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        <span>{manufacturer.name}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-muted-foreground">
                                        <UserX className="h-3 w-3" />
                                        <span>Unassigned</span>
                                      </div>
                                    );
                                  })()}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">
                                  <div className="flex items-center gap-2">
                                    <UserX className="h-3 w-3" />
                                    <span>Unassigned</span>
                                  </div>
                                </SelectItem>
                                <Separator />
                                {manufacturers.map((manufacturer) => (
                                  <SelectItem key={manufacturer.id} value={manufacturer.id}>
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3" />
                                      <span>{manufacturer.name}</span>
                                      <span className="text-xs text-muted-foreground">({manufacturer.email})</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{progressPercentage}%</span>
                                <div className="w-20 bg-muted h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all duration-300" 
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {stageProgress.completed}/{stageProgress.total} stages
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-sm">
                            {formatDate(process.startedAt)}
                          </td>
                          <td className="py-3 text-sm">
                            {formatDate(process.estimatedCompletionDate)}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProcess(process.id)}
                                data-testid={`button-view-process-${process.id}`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

      {/* Enhanced Process Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Manufacturing Process Details
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4">
              <span>Order ID: {selectedProcess?.orderId}</span>
              {selectedProcess?.order && (
                <span>Order #{selectedProcess.order.orderNumber}</span>
              )}
              {selectedProcess?.assignedManufacturer && (
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Assigned to: {selectedProcess.assignedManufacturer.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcess && (
            <Tabs defaultValue="timeline" className="h-full overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline & Progress</TabsTrigger>
                <TabsTrigger value="updates" data-testid="tab-updates">Updates & Communication</TabsTrigger>
                <TabsTrigger value="management" data-testid="tab-management">Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline" className="overflow-auto h-[60vh] mt-4">
                <Timeline
                  process={selectedProcess}
                  userRole="admin"
                  onStageClick={handleStageClick}
                  showProgress={true}
                  className="h-full"
                />
                
                {selectedStageForUpdate && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Post Update for: {selectedStageForUpdate.name}
                    </h4>
                    <StageUpdateComposer
                      stageId={selectedStageForUpdate.id}
                      processId={selectedProcess.id}
                      userRole="admin"
                      placeholder="Share an admin update about this stage..."
                      showTitle={false}
                      compact={true}
                      onSuccess={() => {
                        handleViewProcess(selectedProcess.id);
                        setSelectedStageForUpdate(null);
                      }}
                      onCancel={() => setSelectedStageForUpdate(null)}
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="updates" className="overflow-auto h-[60vh] mt-4">
                <div className="space-y-4">
                  {selectedProcess.stages?.map((stage) => (
                    stage.updates && stage.updates.length > 0 && (
                      <div key={stage.id} className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <Settings className="h-4 w-4" />
                          <h4 className="font-medium">{stage.name}</h4>
                          <Badge variant="outline">{stage.updates.length} updates</Badge>
                        </div>
                        {stage.updates.map((update) => (
                          <UpdateCard
                            key={update.id}
                            update={update}
                            userRole="admin"
                            onReply={handleUpdateReply}
                            showFullContent={true}
                          />
                        ))}
                      </div>
                    )
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No updates posted for this process yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="management" className="overflow-auto h-[60vh] mt-4">
                <div className="space-y-6">
                  {/* Process Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Process Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Current Status</Label>
                          <div className="mt-1">{getStatusBadge(selectedProcess.status)}</div>
                        </div>
                        <div>
                          <Label>Started</Label>
                          <div className="mt-1 text-sm">{formatDate(selectedProcess.startedAt)}</div>
                        </div>
                        <div>
                          <Label>Estimated Completion</Label>
                          <div className="mt-1 text-sm">{formatDate(selectedProcess.estimatedCompletionDate)}</div>
                        </div>
                        <div>
                          <Label>Assigned Manufacturer</Label>
                          <div className="mt-1">
                            {selectedProcess.assignedManufacturer ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-3 w-3 text-green-600" />
                                <span className="text-sm">
                                  {selectedProcess.assignedManufacturer.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleAssignManufacturer(selectedProcess.id, selectedProcess.assignedManufacturer?.id)}
                                >
                                  Reassign
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <UserX className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Unassigned</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleAssignManufacturer(selectedProcess.id)}
                                >
                                  Assign
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCreateStageDialogOpen(true)}
                          data-testid="add-stage-button"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Stage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignManufacturer(selectedProcess.id, selectedProcess.assignedManufacturer?.id)}
                          data-testid="manage-assignment-button"
                        >
                          <User className="h-3 w-3 mr-1" />
                          Manage Assignment
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetchProcesses()}
                          data-testid="refresh-process-button"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Process Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Manufacturing Process</DialogTitle>
            <DialogDescription>
              Create a new manufacturing process for an existing order.
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
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProcess}
              disabled={createProcessMutation.isPending}
              data-testid="button-create-process"
            >
              {createProcessMutation.isPending ? "Creating..." : "Create Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manufacturer Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Manufacturer</DialogTitle>
            <DialogDescription>
              Assign a manufacturer to this manufacturing process.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="manufacturer-select">Select Manufacturer</Label>
              <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                <SelectTrigger data-testid="manufacturer-assignment-select">
                  <SelectValue placeholder="Choose a manufacturer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassign (no manufacturer)</SelectItem>
                  <Separator />
                  {manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer.id} value={manufacturer.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{manufacturer.name}</span>
                        <span className="text-xs text-muted-foreground">({manufacturer.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (assignmentProcessId) {
                  assignManufacturerMutation.mutate({
                    processId: assignmentProcessId,
                    manufacturerId: selectedManufacturer || null
                  });
                }
              }}
              disabled={assignManufacturerMutation.isPending}
              data-testid="button-assign-manufacturer"
            >
              {assignManufacturerMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Stage Dialog */}
      <Dialog open={isCreateStageDialogOpen} onOpenChange={setIsCreateStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manufacturing Stage</DialogTitle>
            <DialogDescription>
              Add a new stage to this manufacturing process.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="stage-name">Stage Name</Label>
              <Input
                id="stage-name"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Enter stage name"
                data-testid="input-stage-name"
              />
            </div>
            <div>
              <Label htmlFor="stage-description">Description (Optional)</Label>
              <Textarea
                id="stage-description"
                value={newStageDescription}
                onChange={(e) => setNewStageDescription(e.target.value)}
                placeholder="Enter stage description"
                data-testid="textarea-stage-description"
              />
            </div>
            <div>
              <Label htmlFor="stage-duration">Estimated Duration (Hours)</Label>
              <Input
                id="stage-duration"
                type="number"
                value={newStageEstimatedDuration}
                onChange={(e) => setNewStageEstimatedDuration(e.target.value)}
                placeholder="Enter estimated hours"
                data-testid="input-stage-duration"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateStageDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateStage}
              disabled={createStageMutation.isPending}
              data-testid="button-create-stage"
            >
              {createStageMutation.isPending ? "Creating..." : "Add Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}