import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Calendar, User, MessageSquare, Plus, Trash2, Edit } from "lucide-react";
import type { SupportTicket, Faq, CreateFaqRequest, UpdateFaqRequest } from "@shared/schema";

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

export default function AdminSupport() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  const { data: ticketsData, isLoading } = useQuery<{ tickets: SupportTicket[] }>({
    queryKey: ["/api/support/all", statusFilter, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      const url = `/api/support/all${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await apiRequest("GET", url);
      return await response.json();
    },
  });

  const { data: faqsData } = useQuery<{ faqs: Faq[] }>({
    queryKey: ["/api/faqs/all"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/support/all"] });
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

  const createFaqMutation = useMutation({
    mutationFn: async (data: CreateFaqRequest) => {
      const response = await apiRequest("POST", "/api/faqs", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "FAQ created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/faqs/all"] });
      setShowFaqDialog(false);
      setFaqQuestion("");
      setFaqAnswer("");
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFaqRequest }) => {
      const response = await apiRequest("PATCH", `/api/faqs/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "FAQ updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/faqs/all"] });
      setEditingFaq(null);
      setShowFaqDialog(false);
      setFaqQuestion("");
      setFaqAnswer("");
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/faqs/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "FAQ deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/faqs/all"] });
    },
  });

  const handleSaveFaq = () => {
    if (!faqQuestion || !faqAnswer) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (editingFaq) {
      updateFaqMutation.mutate({ id: editingFaq.id, data: { question: faqQuestion, answer: faqAnswer } });
    } else {
      createFaqMutation.mutate({ question: faqQuestion, answer: faqAnswer, category: "general", isActive: true });
    }
  };

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

  const handleUpdatePriority = (ticketId: string, priority: string) => {
    updateTicketMutation.mutate({
      id: ticketId,
      updates: { priority },
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
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-support-center">Support Center</h1>
        <p className="text-muted-foreground">Manage and respond to customer support requests</p>
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

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="status-filter" className="mb-2 block">Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="status-filter" data-testid="select-status-filter">
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

        <div className="flex-1">
          <Label htmlFor="category-filter" className="mb-2 block">Category Filter</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger id="category-filter" data-testid="select-category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="sales">Sales Inquiry</SelectItem>
              <SelectItem value="customer_support">Customer Support</SelectItem>
              <SelectItem value="manufacturing">Manufacturing Question</SelectItem>
              <SelectItem value="technical">Technical Issue</SelectItem>
              <SelectItem value="general">General Question</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="open" className="mt-6">
          <TicketList 
            tickets={ticketsByStatus.open}
            onSelectTicket={setSelectedTicket}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6">
          <TicketList 
            tickets={ticketsByStatus.in_progress}
            onSelectTicket={setSelectedTicket}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="resolved" className="mt-6">
          <TicketList 
            tickets={ticketsByStatus.resolved}
            onSelectTicket={setSelectedTicket}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          <TicketList 
            tickets={ticketsByStatus.closed}
            onSelectTicket={setSelectedTicket}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            getStatusBadge={getStatusBadge}
            getPriorityBadge={getPriorityBadge}
          />
        </TabsContent>
      </Tabs>

      {/* FAQ Management Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Manage FAQs</CardTitle>
              <CardDescription>Create and manage frequently asked questions</CardDescription>
            </div>
            <Button onClick={() => { setEditingFaq(null); setFaqQuestion(""); setFaqAnswer(""); setShowFaqDialog(true); }} data-testid="button-add-faq">
              <Plus className="h-4 w-4 mr-2" /> Add FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqsData?.faqs && faqsData.faqs.length > 0 ? (
              faqsData.faqs.map((faq) => (
                <Card key={faq.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                      <div className="mt-2 flex gap-2">
                        <Badge variant={faq.isActive ? "default" : "secondary"}>{faq.isActive ? "Active" : "Inactive"}</Badge>
                        {faq.category && <Badge variant="outline">{faq.category}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline" onClick={() => { setEditingFaq(faq); setFaqQuestion(faq.question); setFaqAnswer(faq.answer); setShowFaqDialog(true); }} data-testid={`button-edit-faq-${faq.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteFaqMutation.mutate(faq.id)} data-testid={`button-delete-faq-${faq.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No FAQs created yet. Click "Add FAQ" to create one.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Dialog */}
      <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFaq ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
            <DialogDescription>Fill in the question and answer for the FAQ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="faq-question">Question</Label>
              <Input id="faq-question" value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} placeholder="Enter the question" data-testid="input-faq-question" />
            </div>
            <div>
              <Label htmlFor="faq-answer">Answer</Label>
              <Textarea id="faq-answer" value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} placeholder="Enter the answer" rows={4} data-testid="input-faq-answer" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFaqDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveFaq} data-testid="button-save-faq">{editingFaq ? "Update" : "Create"} FAQ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      {selectedTicket && (
        <TicketDetailDialog 
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={handleUpdateStatus}
          onUpdatePriority={handleUpdatePriority}
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
  onUpdateStatus: (id: string, status: string) => void;
  onUpdatePriority: (id: string, priority: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getPriorityBadge: (priority: string) => JSX.Element;
}

function TicketList({ tickets, onSelectTicket, getStatusBadge, getPriorityBadge }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No support tickets found
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
  onUpdatePriority: (id: string, priority: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  getPriorityBadge: (priority: string) => JSX.Element;
}

function TicketDetailDialog({ ticket, open, onClose, onUpdateStatus, onUpdatePriority, getStatusBadge, getPriorityBadge }: TicketDetailDialogProps) {
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
          {/* Status & Priority */}
          <div className="flex gap-4">
            <div className="flex-1">
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

            <div className="flex-1">
              <Label className="mb-2 block">Priority</Label>
              <Select value={ticket.priority} onValueChange={(value) => onUpdatePriority(ticket.id, value)}>
                <SelectTrigger data-testid="select-ticket-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
