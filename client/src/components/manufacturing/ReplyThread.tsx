import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  User, 
  Calendar, 
  Send, 
  MessageSquare,
  AlertCircle
} from "lucide-react";
import type { StageUpdateReply } from "@shared/schema";

interface ReplyThreadProps {
  updateId: string;
  replies: StageUpdateReply[];
  userRole: "customer" | "manufacturer" | "admin";
  onReply?: (updateId: string, content: string) => void;
  isReplying?: boolean;
  className?: string;
  maxReplies?: number;
  showReplyForm?: boolean;
}

export function ReplyThread({ 
  updateId, 
  replies, 
  userRole, 
  onReply,
  isReplying = false,
  className,
  maxReplies = 10,
  showReplyForm = true
}: ReplyThreadProps) {
  const [replyContent, setReplyContent] = useState("");
  const [showAllReplies, setShowAllReplies] = useState(false);

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
    return replies.find(r => r.authorUserId === userId)?.authorRole.charAt(0).toUpperCase() || "U";
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    
    const replyDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - replyDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - replyDate.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return replyDate.toLocaleDateString();
    }
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !onReply) return;
    
    onReply(updateId, replyContent.trim());
    setReplyContent("");
  };

  const canReply = onReply && (userRole === "manufacturer" || userRole === "admin");
  
  // Sort replies by creation date (oldest first for conversation flow)
  const sortedReplies = [...replies].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateA - dateB;
  });
  
  const repliesToShow = showAllReplies ? sortedReplies : sortedReplies.slice(-maxReplies);
  const hasMoreReplies = sortedReplies.length > maxReplies;

  return (
    <div className={cn("space-y-3", className)} data-testid={`reply-thread-${updateId}`}>
      {/* Show "Load more replies" button if there are hidden replies */}
      {hasMoreReplies && !showAllReplies && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllReplies(true)}
          className="text-xs text-muted-foreground"
          data-testid="load-more-replies"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Load {sortedReplies.length - maxReplies} more replies
        </Button>
      )}

      {/* Replies */}
      <div className="space-y-3" data-testid="replies-container">
        {repliesToShow.map((reply, index) => (
          <div 
            key={reply.id} 
            className="flex gap-3 text-sm"
            data-testid={`reply-${reply.id}`}
          >
            <Avatar className="h-6 w-6 mt-0.5">
              <AvatarFallback className={cn("text-xs", getRoleColor(reply.authorRole))}>
                {getInitials(reply.authorUserId)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs px-1 py-0", getRoleColor(reply.authorRole))}
                  data-testid={`reply-author-role-${reply.id}`}
                >
                  {reply.authorRole}
                </Badge>
                <span className="text-xs text-muted-foreground" data-testid={`reply-timestamp-${reply.id}`}>
                  {formatDate(reply.createdAt)}
                </span>
              </div>
              
              <div 
                className="bg-muted/50 rounded-lg px-3 py-2 text-sm"
                data-testid={`reply-content-${reply.id}`}
              >
                {reply.message}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {replies.length === 0 && !canReply && (
        <div className="text-center py-4 text-muted-foreground text-sm" data-testid="replies-empty-state">
          No replies yet
        </div>
      )}

      {/* Reply form */}
      {canReply && showReplyForm && (
        <>
          {replies.length > 0 && <Separator />}
          <div className="space-y-3" data-testid="reply-form">
            <div className="flex items-start gap-3">
              <Avatar className="h-6 w-6 mt-1">
                <AvatarFallback className={cn("text-xs", getRoleColor(userRole))}>
                  {userRole.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                  disabled={isReplying}
                  data-testid="reply-textarea"
                />
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {userRole === "manufacturer" ? (
                      "Replying as manufacturer"
                    ) : userRole === "admin" ? (
                      "Replying as admin"
                    ) : (
                      "Replying as customer"
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || isReplying}
                    data-testid="reply-submit"
                  >
                    {isReplying ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Reply
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Character limit indicator */}
                <div className="text-xs text-muted-foreground text-right">
                  {replyContent.length}/1000
                  {replyContent.length > 900 && (
                    <span className="text-orange-500 ml-1">
                      <AlertCircle className="h-3 w-3 inline" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Permissions notice for customers */}
      {!canReply && userRole === "customer" && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2" data-testid="reply-permission-notice">
          <User className="h-3 w-3 inline mr-1" />
          Only manufacturers and administrators can reply to updates
        </div>
      )}
    </div>
  );
}