import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  Eye, 
  Search, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause,
  Activity,
  Calendar
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
    orderNumber: string;
    userId: string;
    status: string;
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
  page: number;
  limit: number;
  totalPages: number;
}

export default function ManufacturerProcesses() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 20;

  const { data: processesData, isLoading } = useQuery<ProcessesResponse>({
    queryKey: ["/api/manufacturer/processes", page, statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const response = await apiRequest("GET", `/api/manufacturer/processes?${params.toString()}`);
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Pending</Badge>;
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
        return <Clock className="h-3 w-3" />;
      case "in_progress":
        return <Activity className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "paused":
        return <Pause className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  const getProgressPercentage = (process: ManufacturingProcess) => {
    if (process.totalStages === 0) return 0;
    return Math.round((process.completedStages / process.totalStages) * 100);
  };

  return (
    <div className="space-y-6" data-testid="manufacturer-processes">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-processes-title">
            My Processes
          </h1>
          <p className="text-muted-foreground" data-testid="text-processes-description">
            Manage all your assigned manufacturing processes
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card data-testid="card-filters">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search by Order ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Enter order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter("all");
                  setSearchTerm("");
                  setPage(1);
                }}
                data-testid="button-clear-filters"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processes List */}
      <Card data-testid="card-processes-list">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manufacturing Processes</CardTitle>
              <CardDescription>
                {processesData?.total || 0} total processes assigned to you
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                      <div className="h-3 bg-muted rounded animate-pulse w-48"></div>
                    </div>
                    <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : processesData?.processes && processesData.processes.length > 0 ? (
            <div className="space-y-4">
              {processesData.processes.map((process) => (
                <div key={process.id} 
                     className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                     data-testid={`process-${process.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Process Header */}
                      <div className="flex items-center gap-3">
                        <div className="font-mono font-medium text-lg">
                          {process.orderId}
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(process.status)}
                          {getStatusBadge(process.status)}
                        </div>
                        {process.order && (
                          <Badge variant="outline" className="text-xs">
                            Order #{process.order.orderNumber}
                          </Badge>
                        )}
                      </div>

                      {/* Progress and Timeline Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Progress</Label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${getProgressPercentage(process)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">
                              {process.completedStages}/{process.totalStages}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Started</Label>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(process.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {process.estimatedCompletionDate && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Est. Completion</Label>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(process.estimatedCompletionDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recent Updates */}
                      {process.stages.some(s => s.recentUpdates.length > 0) && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Recent Activity</Label>
                          <div className="text-xs text-muted-foreground">
                            {process.stages
                              .filter(s => s.recentUpdates.length > 0)
                              .slice(0, 2)
                              .map(stage => 
                                `${stage.name}: ${stage.recentUpdates[0].title}`
                              )
                              .join(" • ")}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {process.notes && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {process.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button 
                        asChild 
                        variant="outline"
                        data-testid={`button-view-process-${process.id}`}
                      >
                        <Link href={`processes/${process.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No processes found</h3>
              <p>
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters to see more results."
                  : "You don't have any manufacturing processes assigned yet."
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {processesData && processesData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
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
        </CardContent>
      </Card>
    </div>
  );
}