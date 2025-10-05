import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Calendar, User, MessageSquare, Package } from "lucide-react";
import type { SupportTicket } from "@shared/schema";

const categoryLabels: Record<string, string> = {
  sales: "Sales Inquiry",
  customer_support: "Customer Support",
  manufacturing: "Manufacturing Question",
  technical: "Technical Issue",
  general: "General Question",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-yellow-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-400",
  high: "bg-orange-400",
  urgent: "bg-red-500",
};

export default function ManufacturerSupport() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: ticketsData, isLoading } = useQuery<{ tickets: SupportTicket[] }>({
    queryKey: ["/api/support/manufacturer", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      const url = `/api/support/manufacturer${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await apiRequest("GET", url);
      return await response.json();
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/support/${id}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket updated",
        description: "Support ticket has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support/manufacturer"] });
      setSelectedTicket(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  const tickets = ticketsData?.tickets || [];

  const ticketsByStatus = {
    open: tickets.filter(t => t.status === "open"),
    in_progress: tickets.filter(t => t.status === "in_progress"),
    resolved: tickets.filter(t => t.status === "resolved"),
    closed: tickets.filter(t => t.status === "closed"),
  };

  const handleUpdateStatus = (ticketId: string, status: string) => {
    updateTicketMutation.mutate({
      id: ticketId,
      updates: { status },
    });
  };

  const getStatusBadge = (status: string) => (
    <Badge className={statusColors[status] || "bg-gray-500"} data-testid={`badge-status-${status}`}>
      {status.replace("_", " ")}
    </Badge>
  );

  const getPriorityBadge = (priority: string) => (
    <Badge className={priorityColors[priority] || "bg-gray-400"} data-testid={`badge-priority-${priority}`}>
      {priority}
    </Badge>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading support tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-manufacturer-support">Manufacturing Support</h1>
        <p className="text-muted-foreground">View and respond to manufacturing-related customer questions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card data-testid="card-stat-open">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsByStatus.open.length}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-in-progress">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsByStatus.in_progress.length}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-resolved">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsByStatus.resolved.length}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-closed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsByStatus.closed.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <Label htmlFor="status-filter" className="mb-2 block">Status Filter</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter" data-testid="select-status-filter" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets by Status Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({ticketsByStatus.open.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({ticketsByStatus.in_progress.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({ticketsByStatus.resolved.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({ticketsByStatus.closed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <TicketList 
            tickets={tickets}
            onSelectTicket={setSelectedTicket}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="open" className="mt-6">
          <TicketList 
            tickets={ticketsByStatus.open}
            onSelectTicket={setSelectedTicket}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6">
          <TicketList 
            tickets={ticketsByStatus.in_progress}
            onSelectTicket={setSelectedTicket}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="resolved" className="mt-6">
          <TicketList 
            tickets={ticketsByStatus.resolved}
            onSelectTicket={setSelectedTicket}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          <TicketList 
            tickets={ticketsByStatus.closed}
            onSelectTicket={setSelectedTicket}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <TicketDetailDialog 
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={handleUpdateStatus}
          getStatusBadge={getStatusBadge}
          getPriorityBadge={getPriorityBadge}
        />
      )}
    </div>
  );
}

interface TicketListProps {
  tickets: SupportTicket[];
  onSelectTicket: (ticket: SupportTicket) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getPriorityBadge: (priority: string) => JSX.Element;
}

function TicketList({ tickets, onSelectTicket, getStatusBadge, getPriorityBadge }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No manufacturing support tickets found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectTicket(ticket)} data-testid={`ticket-card-${ticket.id}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1" data-testid={`ticket-subject-${ticket.id}`}>{ticket.subject}</h3>
                <p className="text-sm text-muted-foreground">{categoryLabels[ticket.category]}</p>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(ticket.status)}
                {getPriorityBadge(ticket.priority)}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {ticket.message}
            </p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{ticket.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{ticket.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(ticket.createdAt!).toLocaleDateString()}</span>
              </div>
              {ticket.processId && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="font-mono text-xs">{ticket.processId}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface TicketDetailDialogProps {
  ticket: SupportTicket;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getPriorityBadge: (priority: string) => JSX.Element;
}

function TicketDetailDialog({ ticket, open, onClose, onUpdateStatus, getStatusBadge, getPriorityBadge }: TicketDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3" data-testid="dialog-ticket-title">
            <MessageSquare className="h-6 w-6" />
            {ticket.subject}
          </DialogTitle>
          <DialogDescription>
            Ticket ID: {ticket.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status */}
          <div>
            <Label className="mb-2 block">Status</Label>
            <Select value={ticket.status} onValueChange={(value) => onUpdateStatus(ticket.id, value)}>
              <SelectTrigger data-testid="select-ticket-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{ticket.name} {ticket.userRole && `(${ticket.userRole})`}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${ticket.email}`} className="text-primary hover:underline">
                  {ticket.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Submitted on {new Date(ticket.createdAt!).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Message */}
          <div>
            <Label className="mb-2 block">Message</Label>
            <div className="bg-muted p-4 rounded-lg">
              <p className="whitespace-pre-wrap" data-testid="ticket-message">{ticket.message}</p>
            </div>
          </div>

          {/* Additional Info */}
          {(ticket.orderId || ticket.processId) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ticket.orderId && (
                  <div>
                    <span className="text-sm text-muted-foreground">Order ID: </span>
                    <span className="font-mono">{ticket.orderId}</span>
                  </div>
                )}
                {ticket.processId && (
                  <div>
                    <span className="text-sm text-muted-foreground">Process ID: </span>
                    <span className="font-mono">{ticket.processId}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
