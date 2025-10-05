import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Package, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

interface CustomerNotification {
  id: string;
  userId: string;
  orderId: string;
  processId?: string;
  stageId?: string;
  type: string;
  title: string;
  message: string;
  imageUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export default function ManufacturerNotifications() {
  const [, setLocation] = useLocation();

  // Fetch all notifications
  const { data: notificationsData, isLoading } = useQuery<{ notifications: CustomerNotification[], total: number }>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest('POST', '/api/notifications/mark-read', { notificationId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', 'unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/notifications/mark-read', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', 'unread-count'] });
    },
  });

  const handleNotificationClick = (notification: CustomerNotification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate to the order/process
    if (notification.processId) {
      setLocation(`/manufacturer/processes/${notification.processId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'customer_question':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'new_order':
        return <Package className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const NotificationCard = ({ notification }: { notification: CustomerNotification }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20' : ''
      }`}
      onClick={() => handleNotificationClick(notification)}
      data-testid={`notification-${notification.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              {!notification.isRead && (
                <Badge variant="destructive" className="shrink-0">New</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Order #{notification.orderId.slice(-8)}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="page-title">
              Notifications
            </h1>
            <p className="text-muted-foreground">
              Stay updated with customer questions and new orders
            </p>
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground text-center">
              You'll see notifications here when customers ask questions or new orders arrive
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                Unread
                <Badge variant="destructive">{unreadNotifications.length}</Badge>
              </h2>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {unreadNotifications.length > 0 && readNotifications.length > 0 && (
            <Separator />
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Earlier</h2>
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
