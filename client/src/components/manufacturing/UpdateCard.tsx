import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  User, 
  Calendar, 
  MessageSquare, 
  Camera, 
  Lock, 
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { StageUpdate, StageUpdatePhoto, StageUpdateReply } from "@shared/schema";
import { PhotoGrid } from "./PhotoGrid.tsx";
import { ReplyThread } from "./ReplyThread.tsx";

interface UpdateCardProps {
  update: StageUpdate & {
    photos?: StageUpdatePhoto[];
    replies?: StageUpdateReply[];
    stageName?: string;
  };
  userRole: "customer" | "manufacturer" | "admin";
  className?: string;
  onReply?: (updateId: string, content: string) => void;
  isReplying?: boolean;
  showFullContent?: boolean;
}

export function UpdateCard({ 
  update, 
  userRole, 
  className, 
  onReply,
  isReplying = false,
  showFullContent = true
}: UpdateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Hide internal updates from customers
  if (userRole === "customer" && update.isInternal) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "manufacturer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "customer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getInitials = (userId: string) => {
    // In a real app, you'd have user names. For now, use role initial
    return update.authorRole.charAt(0).toUpperCase();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    
    const updateDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 168) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    } else {
      return updateDate.toLocaleDateString();
    }
  };

  const photosToShow = showAllPhotos ? update.photos : update.photos?.slice(0, 4);
  const hasMorePhotos = update.photos && update.photos.length > 4;

  return (
    <Card 
      className={cn(
        "relative",
        update.isInternal && "border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800",
        className
      )}
      data-testid={`update-card-${update.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn("text-xs font-medium", getRoleColor(update.authorRole))}>
                {getInitials(update.authorUserId)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getRoleColor(update.authorRole))}
                  data-testid={`update-author-role-${update.id}`}
                >
                  {update.authorRole}
                </Badge>
                {update.stageName && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" 
                    data-testid={`update-stage-name-${update.id}`}
                  >
                    {update.stageName}
                  </Badge>
                )}
                {update.isInternal && (
                  <Badge variant="secondary" className="text-xs" data-testid={`update-internal-badge-${update.id}`}>
                    <Lock className="h-3 w-3 mr-1" />
                    Internal
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span data-testid={`update-timestamp-${update.id}`}>
                  {formatDate(update.createdAt)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {update.photos && update.photos.length > 0 && (
              <div className="flex items-center gap-1">
                <Camera className="h-3 w-3" />
                <span data-testid={`update-photos-count-${update.id}`}>
                  {update.photos.length}
                </span>
              </div>
            )}
            {update.replies && update.replies.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span data-testid={`update-replies-count-${update.id}`}>
                  {update.replies.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Update content */}
        <div 
          className={cn(
            "text-sm",
            !showFullContent && !isExpanded && "line-clamp-3"
          )}
          data-testid={`update-content-${update.id}`}
        >
          {update.message}
        </div>

        {/* Expand/collapse for long content */}
        {!showFullContent && update.message.length > 200 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
            data-testid={`update-expand-button-${update.id}`}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show more
              </>
            )}
          </Button>
        )}

        {/* Photos */}
        {photosToShow && photosToShow.length > 0 && (
          <div className="space-y-2">
            <PhotoGrid 
              photos={photosToShow.map(photo => ({
                id: photo.id,
                url: photo.url,
                description: photo.filename || undefined,
                createdAt: photo.createdAt ? new Date(photo.createdAt).toISOString() : new Date().toISOString()
              }))}
              size="sm"
              data-testid={`update-photos-${update.id}`}
            />
            {hasMorePhotos && !showAllPhotos && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllPhotos(true)}
                className="text-xs"
                data-testid={`update-show-all-photos-${update.id}`}
              >
                <Camera className="h-3 w-3 mr-1" />
                Show {update.photos!.length - 4} more photos
              </Button>
            )}
          </div>
        )}

        {/* Replies section */}
        {update.replies && update.replies.length > 0 && (
          <>
            <Separator />
            <ReplyThread
              updateId={update.id}
              replies={update.replies}
              userRole={userRole}
              onReply={onReply}
              isReplying={isReplying}
              data-testid={`update-replies-${update.id}`}
            />
          </>
        )}

        {/* Reply form for updates without existing replies */}
        {(!update.replies || update.replies.length === 0) && onReply && (userRole === "manufacturer" || userRole === "admin") && (
          <>
            <Separator />
            <ReplyThread
              updateId={update.id}
              replies={[]}
              userRole={userRole}
              onReply={onReply}
              isReplying={isReplying}
              data-testid={`update-new-reply-${update.id}`}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}