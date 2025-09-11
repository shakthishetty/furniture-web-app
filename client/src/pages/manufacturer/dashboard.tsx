import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Pause, 
  Eye,
  TrendingUp,
  Activity
} from "lucide-react";

interface DashboardStats {
  totalProcesses: number;
  activeProcesses: number;
  completedProcesses: number;
  pendingProcesses: number;
  pausedProcesses: number;
  processesNeedingAttention: Array<{
    processId: string;
    orderId: string;
    status: string;
    hasBlockedStages: boolean;
    hasOverdueStages: boolean;
  }>;
  recentActivity: Array<{
    processId: string;
    orderId: string;
    status: string;
    updatedAt: string;
  }>;
}

export default function ManufacturerDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/manufacturer/dashboard/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/manufacturer/dashboard/stats");
      return response.json();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "in_progress":
        return <Activity className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      in_progress: "default",
      completed: "default",
      paused: "destructive",
    } as const;
    
    const colors = {
      pending: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800", 
      paused: "bg-yellow-100 text-yellow-800",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} 
             className={colors[status as keyof typeof colors] || ""}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getCompletionRate = () => {
    if (!stats || stats.totalProcesses === 0) return 0;
    return Math.round((stats.completedProcesses / stats.totalProcesses) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your manufacturing dashboard</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="manufacturer-dashboard">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground" data-testid="text-dashboard-description">
          Welcome to your manufacturing dashboard
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-processes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-processes">
              {stats?.totalProcesses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All assigned processes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-processes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-active-processes">
              {stats?.activeProcesses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-processes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-processes">
              {stats?.completedProcesses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {getCompletionRate()}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-processes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-processes">
              {stats?.pendingProcesses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Waiting to start
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      {stats && stats.totalProcesses > 0 && (
        <Card data-testid="card-progress-overview">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Completion</span>
                <span className="font-medium">{getCompletionRate()}%</span>
              </div>
              <Progress value={getCompletionRate()} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active:</span>
                <span className="font-medium text-blue-600">{stats.activeProcesses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paused:</span>
                <span className="font-medium text-yellow-600">{stats.pausedProcesses}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Processes Needing Attention */}
        <Card data-testid="card-attention-needed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Needs Attention
            </CardTitle>
            <CardDescription>
              Processes with blocked or overdue stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.processesNeedingAttention && stats.processesNeedingAttention.length > 0 ? (
              <div className="space-y-3">
                {stats.processesNeedingAttention.map((process) => (
                  <div key={process.processId} 
                       className="flex items-center justify-between p-3 border rounded-lg"
                       data-testid={`attention-process-${process.processId}`}>
                    <div className="space-y-1">
                      <div className="font-medium font-mono text-sm">
                        {process.orderId}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(process.status)}
                        {getStatusBadge(process.status)}
                        {process.hasBlockedStages && (
                          <Badge variant="destructive" className="text-xs">Blocked</Badge>
                        )}
                        {process.hasOverdueStages && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" data-testid={`button-view-${process.processId}`}>
                      <Link href={`/manufacturer/processes/${process.processId}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No processes need immediate attention</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates on your processes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.processId} 
                       className="flex items-center justify-between p-3 border rounded-lg"
                       data-testid={`activity-${activity.processId}`}>
                    <div className="space-y-1">
                      <div className="font-medium font-mono text-sm">
                        {activity.orderId}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(activity.status)}
                        {getStatusBadge(activity.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" data-testid={`button-view-activity-${activity.processId}`}>
                      <Link href={`/manufacturer/processes/${activity.processId}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild data-testid="button-view-all-processes">
              <Link href="/manufacturer/processes">
                <Package className="h-4 w-4 mr-2" />
                View All Processes
              </Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-view-active-processes">
              <Link href="/manufacturer/processes?status=in_progress">
                <Activity className="h-4 w-4 mr-2" />
                Active Processes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}