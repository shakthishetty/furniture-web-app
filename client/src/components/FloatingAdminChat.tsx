import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, X, Send, User } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface CustomerQuestion {
  id: string;
  message: string;
  createdAt: string;
  authorRole: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  userId: string;
  replies?: Array<{
    id: string;
    message: string;
    createdAt: string;
    authorRole: string;
  }>;
}

export function FloatingAdminChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<CustomerQuestion | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const { toast } = useToast();

  // Fetch all customer questions
  const { data: questionsData, isLoading } = useQuery<{ questions: CustomerQuestion[] }>({
    queryKey: ['/api/admin/customer-questions'],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const questions = questionsData?.questions || [];
  const unreadCount = questions.filter(q => !q.replies || q.replies.length === 0).length;

  // Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ questionId, message }: { questionId: string; message: string }) => {
      return await apiRequest('POST', '/api/admin/customer-questions/reply', { 
        questionId, 
        message 
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customer-questions'] });
      
      // Update the selected question with the new reply to show it immediately
      if (selectedQuestion && data) {
        setSelectedQuestion({
          ...selectedQuestion,
          replies: [...(selectedQuestion.replies || []), data],
        });
      }
      
      setReplyMessage("");
      toast({
        title: "Reply sent",
        description: "Your response has been sent to the customer",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendReply = () => {
    if (!selectedQuestion || !replyMessage.trim()) return;
    replyMutation.mutate({
      questionId: selectedQuestion.id,
      message: replyMessage.trim(),
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          data-testid="floating-chat-button"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">Customer Questions</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              data-testid="close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          {selectedQuestion ? (
            <div className="flex-1 flex flex-col">
              {/* Conversation Header */}
              <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedQuestion(null)}
                  className="mb-2"
                  data-testid="button-back"
                >
                  ← Back
                </Button>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="font-semibold text-sm">{selectedQuestion.customerName}</p>
                    <p className="text-xs text-gray-500">Order #{selectedQuestion.orderNumber}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Customer Question */}
                  <div className="flex gap-2">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-sm">{selectedQuestion.message}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(selectedQuestion.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Admin Replies */}
                  {selectedQuestion.replies && selectedQuestion.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2 flex-row-reverse">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <p className="text-sm">{reply.message}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 min-h-[60px]"
                    data-testid="reply-textarea"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || replyMutation.isPending}
                    data-testid="send-reply-button"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Questions List */
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No customer questions yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => setSelectedQuestion(question)}
                      data-testid={`question-${question.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{question.customerName}</p>
                            {(!question.replies || question.replies.length === 0) && (
                              <Badge variant="destructive" className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Order #{question.orderNumber}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {question.message}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}
    </>
  );
}
