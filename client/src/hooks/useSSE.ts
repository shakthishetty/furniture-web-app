import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SSEMessage {
  type: 'stage_status_update' | 'new_update' | 'new_reply' | 'process_update' | 'error' | 'ping';
  data: any;
  processId?: string;
  stageId?: string;
  updateId?: string;
  timestamp: string;
}

interface UseSSEOptions {
  processId?: string;
  userRole: 'customer' | 'manufacturer' | 'admin';
  autoReconnect?: boolean;
  reconnectDelay?: number;
  showToastNotifications?: boolean;
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface SSEState {
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastMessage: SSEMessage | null;
}

export function useSSE(options: UseSSEOptions) {
  const {
    processId,
    userRole,
    autoReconnect = true,
    reconnectDelay = 3000,
    showToastNotifications = true,
    onMessage,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const [state, setState] = useState<SSEState>({
    isConnected: false,
    error: null,
    reconnectAttempts: 0,
    lastMessage: null
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState(prev => ({ ...prev, isConnected: false }));
    onDisconnect?.();
  }, [onDisconnect]);

  const handleMessage = useCallback((message: SSEMessage) => {
    setState(prev => ({ ...prev, lastMessage: message, error: null }));
    
    // Handle different message types
    switch (message.type) {
      case 'stage_status_update':
        // Invalidate relevant queries
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturing/processes', message.processId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/admin/manufacturing/processes'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturer/processes'] 
        });
        
        if (showToastNotifications && message.data?.stageName) {
          toast({
            title: "Stage Updated",
            description: `${message.data.stageName} status changed to ${message.data.status}`,
          });
        }
        break;
        
      case 'new_update':
        // Invalidate stage-specific queries
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturing/stages', message.stageId, 'updates'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturing/processes', message.processId] 
        });
        
        if (showToastNotifications && !message.data?.isInternal && message.data?.authorRole !== userRole) {
          toast({
            title: "New Update",
            description: `New update from ${message.data?.authorRole}`,
          });
        }
        break;
        
      case 'new_reply':
        // Invalidate update-specific queries
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturing/updates', message.updateId, 'replies'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturing/processes', message.processId] 
        });
        
        if (showToastNotifications && message.data?.authorRole !== userRole) {
          toast({
            title: "New Reply",
            description: `New reply from ${message.data?.authorRole}`,
          });
        }
        break;
        
      case 'process_update':
        // Invalidate process queries
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturing/processes', message.processId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/admin/manufacturing/processes'] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['/api/manufacturer/processes'] 
        });
        break;
        
      case 'error':
        setState(prev => ({ ...prev, error: message.data?.message || 'SSE Error' }));
        if (showToastNotifications) {
          toast({
            title: "Real-time Update Error",
            description: message.data?.message || 'Connection error occurred',
            variant: "destructive",
          });
        }
        break;
        
      case 'ping':
        // Health check - no action needed
        break;
    }
    
    // Call custom message handler
    onMessage?.(message);
  }, [queryClient, toast, showToastNotifications, onMessage, userRole]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      disconnect();
    }

    try {
      // Build SSE URL based on user role and process
      let sseUrl = '/api/sse/manufacturing';
      const params = new URLSearchParams();
      
      if (processId) {
        params.append('processId', processId);
      }
      params.append('role', userRole);
      
      if (params.toString()) {
        sseUrl += `?${params.toString()}`;
      }

      const eventSource = new EventSource(sseUrl, {
        withCredentials: true
      });

      eventSource.onopen = () => {
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          error: null, 
          reconnectAttempts: 0 
        }));
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        setState(prev => ({ 
          ...prev, 
          isConnected: false,
          error: 'Connection lost'
        }));
        
        onError?.(error);
        
        // Auto-reconnect logic
        if (autoReconnect && state.reconnectAttempts < maxReconnectAttempts) {
          setState(prev => ({ 
            ...prev, 
            reconnectAttempts: prev.reconnectAttempts + 1 
          }));
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect SSE (attempt ${state.reconnectAttempts + 1}/${maxReconnectAttempts})`);
            connect();
          }, reconnectDelay * Math.pow(2, state.reconnectAttempts)); // Exponential backoff
        } else if (state.reconnectAttempts >= maxReconnectAttempts) {
          setState(prev => ({ 
            ...prev, 
            error: 'Max reconnection attempts reached' 
          }));
          
          if (showToastNotifications) {
            toast({
              title: "Connection Failed",
              description: "Real-time updates unavailable. Please refresh the page.",
              variant: "destructive",
            });
          }
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to establish connection' 
      }));
    }
  }, [processId, userRole, autoReconnect, reconnectDelay, state.reconnectAttempts, handleMessage, onConnect, onError, disconnect, showToastNotifications, toast]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    isSupported: typeof EventSource !== 'undefined'
  };
}

// Utility hook for manufacturing-specific SSE
export function useManufacturingSSE(
  processId: string, 
  userRole: 'customer' | 'manufacturer' | 'admin',
  options: Partial<UseSSEOptions> = {}
) {
  return useSSE({
    processId,
    userRole,
    ...options
  });
}

// Hook for manufacturer dashboard SSE
export function useManufacturerDashboardSSE(
  userRole: 'manufacturer' | 'admin',
  options: Partial<UseSSEOptions> = {}
) {
  return useSSE({
    userRole,
    ...options
  });
}