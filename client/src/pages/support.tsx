import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, Clock, HelpCircle, MessageSquare, Package, Wrench } from "lucide-react";
import type { SupportTicket, Faq } from "@shared/schema";

const supportFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  category: z.enum(["sales", "customer_support", "manufacturing", "technical", "general"]),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
  orderId: z.string().optional(),
  processId: z.string().optional(),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

const categoryIcons = {
  sales: Package,
  customer_support: MessageSquare,
  manufacturing: Wrench,
  technical: HelpCircle,
  general: HelpCircle,
};

const categoryLabels = {
  sales: "Sales Inquiry",
  customer_support: "Customer Support",
  manufacturing: "Manufacturing Question",
  technical: "Technical Issue",
  general: "General Question",
};

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showTickets, setShowTickets] = useState(false);

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      name: user ? `${user.firstName} ${user.lastName}` : "",
      email: user?.email || "",
      category: "general",
      subject: "",
      message: "",
      orderId: "",
      processId: "",
    },
  });

  const { data: faqsData, isLoading: faqsLoading } = useQuery<{ faqs: Faq[] }>({
    queryKey: ["/api/faqs"],
  });

  const { data: ticketsData } = useQuery<{ tickets: SupportTicket[] }>({
    queryKey: ["/api/support"],
    enabled: !!user,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: SupportFormValues) => {
      const response = await apiRequest("POST", "/api/support", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Support ticket created",
        description: "We've received your request and will get back to you soon.",
      });
      form.reset({
        name: user ? `${user.firstName} ${user.lastName}` : "",
        email: user?.email || "",
        category: "general",
        subject: "",
        message: "",
        orderId: "",
        processId: "",
      });
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["/api/support"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create support ticket",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupportFormValues) => {
    createTicketMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      open: "default",
      in_progress: "secondary",
      resolved: "outline",
      closed: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-900">
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-foreground dark:text-white">Support Center</h1>
            <p className="text-xl text-muted-foreground dark:text-gray-300">
              How can we help you today?
            </p>
          </div>

          {/* Quick Contact Info */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="card-contact-email">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">Email Us</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">support@teaktheory.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="card-contact-phone">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Phone className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">Call Us</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">1-800-TEAK-THEORY</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="card-contact-hours">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">Support Hours</p>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">Mon-Fri: 9AM - 6PM EST</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {Object.entries(categoryIcons).map(([key, Icon]) => (
              <Card 
                key={key}
                className="cursor-pointer hover:border-primary transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary"
                onClick={() => form.setValue("category", key as any)}
                data-testid={`card-category-${key}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                    <Icon className="h-5 w-5" />
                    {categoryLabels[key as keyof typeof categoryLabels]}
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Get help with {categoryLabels[key as keyof typeof categoryLabels].toLowerCase()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Contact Form */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground dark:text-white">Submit a Support Request</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground dark:text-white">Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Your name" data-testid="input-name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground dark:text-white">Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="your@email.com" data-testid="input-email" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground dark:text-white">Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category" className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                              {Object.entries(categoryLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground dark:text-white">Subject</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Brief description of your issue" data-testid="input-subject" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground dark:text-white">Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Please provide details about your request..." 
                              rows={6}
                              data-testid="textarea-message"
                              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="orderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground dark:text-white">Order ID (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., ORD-12345" data-testid="input-orderId" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="processId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground dark:text-white">Process ID (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., PROC-12345" data-testid="input-processId" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createTicketMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createTicketMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-foreground dark:text-white">Frequently Asked Questions</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {faqsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading FAQs...</div>
                ) : faqsData?.faqs && faqsData.faqs.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {faqsData.faqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left text-foreground dark:text-white" data-testid={`faq-question-${faq.id}`}>
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground dark:text-gray-300" data-testid={`faq-answer-${faq.id}`}>
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-center text-muted-foreground dark:text-gray-400 py-8">
                    No FAQs available at the moment.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Support Ticket History (for logged-in users) */}
          {user && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-foreground dark:text-white">My Support Tickets</CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Track your support requests
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowTickets(!showTickets)}
                    data-testid="button-toggle-tickets"
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    {showTickets ? "Hide" : "Show"} Tickets
                  </Button>
                </div>
              </CardHeader>
              {showTickets && (
                <CardContent>
                  {ticketsData?.tickets && ticketsData.tickets.length > 0 ? (
                    <div className="space-y-4">
                      {ticketsData.tickets.map((ticket: SupportTicket) => (
                        <div
                          key={ticket.id}
                          className="border dark:border-gray-700 rounded-lg p-4 hover:bg-accent dark:hover:bg-gray-700 transition-colors"
                          data-testid={`ticket-${ticket.id}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-foreground dark:text-white" data-testid={`ticket-subject-${ticket.id}`}>
                                {ticket.subject}
                              </p>
                              <p className="text-sm text-muted-foreground dark:text-gray-400">
                                {categoryLabels[ticket.category as keyof typeof categoryLabels]}
                              </p>
                            </div>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-sm text-muted-foreground dark:text-gray-300 mb-2">
                            {ticket.message.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Submitted: {new Date(ticket.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground dark:text-gray-400 py-8">
                      No support tickets yet
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
