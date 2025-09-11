import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Settings,
  Calendar,
  MessageSquare,
  Camera
} from "lucide-react";
import type { ManufacturingProcess, ManufacturingStage } from "@shared/schema";

interface TimelineProps {
  process: ManufacturingProcess & {
    stages: (ManufacturingStage & {
      recentUpdates?: Array<{
        id: string;
        stageId: string;
        message: string;
        isInternal: boolean;
        authorRole: string;
        createdAt: string;
        photos?: Array<{ id: string; url: string }>;
        replies?: Array<{ id: string }>;
      }>;
    })[];
  };
  userRole: "customer" | "manufacturer" | "admin";
  className?: string;
  onStageClick?: (stage: ManufacturingStage) => void;
  showProgress?: boolean;
}

export function Timeline({ 
  process, 
  userRole, 
  className, 
  onStageClick, 
  showProgress = true 
}: TimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "in_progress":
        return <Settings className="h-4 w-4 text-blue-600 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">Not Started</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case "blocked":
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Blocked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = () => {
    if (!process.stages || process.stages.length === 0) return 0;
    const completedStages = process.stages.filter(stage => stage.status === "completed").length;
    return Math.round((completedStages / process.stages.length) * 100);
  };

  const getVisibleUpdates = (stage: ManufacturingStage & { recentUpdates?: any[] }) => {
    if (!stage.recentUpdates) return [];
    if (userRole === "customer") {
      return stage.recentUpdates.filter(update => !update.isInternal);
    }
    return stage.recentUpdates;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const progress = calculateProgress();

  return (
    <div className={cn("space-y-4", className)} data-testid="timeline-container">
      {showProgress && (
        <Card data-testid="timeline-progress">
          <CardHeader>
            <CardTitle className="text-lg">Manufacturing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion</span>
                <span data-testid="progress-percentage">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" data-testid="progress-bar" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Started: {formatDate(typeof process.startedAt === 'string' ? process.startedAt : process.startedAt?.toISOString())}</span>
                <span>Est. Completion: {formatDate(typeof process.estimatedCompletionDate === 'string' ? process.estimatedCompletionDate : process.estimatedCompletionDate?.toISOString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4" data-testid="timeline-stages">
        {process.stages?.map((stage, index) => {
          const visibleUpdates = getVisibleUpdates(stage);
          const isClickable = !!onStageClick;
          
          return (
            <Card 
              key={stage.id} 
              className={cn(
                "relative border-l-4 transition-colors",
                stage.status === "completed" && "border-l-green-500",
                stage.status === "in_progress" && "border-l-blue-500",
                stage.status === "blocked" && "border-l-red-500",
                stage.status === "not_started" && "border-l-gray-300",
                isClickable && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => onStageClick?.(stage)}
              data-testid={`timeline-stage-${stage.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getStatusIcon(stage.status)}
                    <span data-testid={`stage-name-${stage.id}`}>
                      {index + 1}. {stage.name}
                    </span>
                  </CardTitle>
                  {getStatusBadge(stage.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Stage dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {stage.startedAt && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Started: {formatDate(typeof stage.startedAt === 'string' ? stage.startedAt : stage.startedAt?.toISOString())}</span>
                    </div>
                  )}
                  {stage.completedAt && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-3 w-3" />
                      <span>Completed: {formatDate(typeof stage.completedAt === 'string' ? stage.completedAt : stage.completedAt?.toISOString())}</span>
                    </div>
                  )}
                </div>

                {/* Stage updates summary */}
                {visibleUpdates.length > 0 && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span data-testid={`stage-updates-count-${stage.id}`}>
                        {visibleUpdates.length} update{visibleUpdates.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {visibleUpdates.some(update => update.photos && update.photos.length > 0) && (
                      <div className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        <span data-testid={`stage-photos-indicator-${stage.id}`}>
                          {visibleUpdates.reduce((total, update) => total + (update.photos?.length || 0), 0)} photo{visibleUpdates.reduce((total, update) => total + (update.photos?.length || 0), 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {visibleUpdates.some(update => update.replies && update.replies.length > 0) && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span data-testid={`stage-replies-indicator-${stage.id}`}>
                          {visibleUpdates.reduce((total, update) => total + (update.replies?.length || 0), 0)} repl{visibleUpdates.reduce((total, update) => total + (update.replies?.length || 0), 0) === 1 ? 'y' : 'ies'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Latest update preview */}
                {visibleUpdates.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="text-xs text-muted-foreground mb-1">Latest update:</div>
                    <div className="text-sm bg-muted/30 p-2 rounded" data-testid={`stage-latest-update-${stage.id}`}>
                      {visibleUpdates[0].message}
                    </div>
                  </div>
                )}

                {/* Assignment info for manufacturer/admin */}
                {(userRole === "manufacturer" || userRole === "admin") && stage.assignedToUserId && (
                  <div className="text-xs text-muted-foreground">
                    Assigned to: {stage.assignedToUserId}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!process.stages || process.stages.length === 0) && (
        <Card data-testid="timeline-empty-state">
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              No manufacturing stages found for this process.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}