import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle, XCircle, Eye, Building2, Calendar, Mail, Phone, MapPin, Award, ExternalLink, Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createManufacturerSchema, type CreateManufacturerRequest, type Manufacturer } from "@shared/schema";



export default function AdminManufacturers() {
  // Direct Manufacturer state
  const [isAddManufacturerDialogOpen, setIsAddManufacturerDialogOpen] = useState(false);
  const [selectedDirectManufacturer, setSelectedDirectManufacturer] = useState<Manufacturer | null>(null);
  const [isEditManufacturerDialogOpen, setIsEditManufacturerDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Form for adding/editing direct manufacturers
  const form = useForm<CreateManufacturerRequest>({
    resolver: zodResolver(createManufacturerSchema),
    defaultValues: {
      name: "",
      address: "",
      email: "",
      phone: "",
      description: "",
      photoUrl: "",
    },
  });

  // Fetch direct manufacturers
  const { data: directManufacturers, isLoading: isLoadingDirectManufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/admin/direct-manufacturers"],
  });


  // Create direct manufacturer mutation
  const createDirectManufacturerMutation = useMutation({
    mutationFn: async (data: CreateManufacturerRequest) => {
      const response = await apiRequest("POST", "/api/admin/direct-manufacturers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/direct-manufacturers"] });
      toast({
        title: "Success",
        description: "Manufacturer created successfully",
      });
      setIsAddManufacturerDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create manufacturer",
        variant: "destructive",
      });
    },
  });

  // Update direct manufacturer mutation
  const updateDirectManufacturerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateManufacturerRequest }) => {
      const response = await apiRequest("PATCH", `/api/admin/direct-manufacturers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/direct-manufacturers"] });
      toast({
        title: "Success",
        description: "Manufacturer updated successfully",
      });
      setIsEditManufacturerDialogOpen(false);
      form.reset();
      setSelectedDirectManufacturer(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update manufacturer",
        variant: "destructive",
      });
    },
  });

  // Delete direct manufacturer mutation
  const deleteDirectManufacturerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/direct-manufacturers/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/direct-manufacturers"] });
      toast({
        title: "Success",
        description: "Manufacturer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete manufacturer",
        variant: "destructive",
      });
    },
  });

  // Direct manufacturer handlers
  const handleAddManufacturer = () => {
    form.reset();
    setIsAddManufacturerDialogOpen(true);
  };

  const handleEditDirectManufacturer = (manufacturer: Manufacturer) => {
    setSelectedDirectManufacturer(manufacturer);
    form.reset({
      name: manufacturer.name,
      address: manufacturer.address,
      email: manufacturer.email,
      phone: manufacturer.phone,
      description: manufacturer.description || "",
      photoUrl: manufacturer.photoUrl || "",
    });
    setIsEditManufacturerDialogOpen(true);
  };

  const handleDeleteDirectManufacturer = (id: string) => {
    if (confirm("Are you sure you want to delete this manufacturer?")) {
      deleteDirectManufacturerMutation.mutate(id);
    }
  };

  const onSubmitDirectManufacturer = (data: CreateManufacturerRequest) => {
    if (selectedDirectManufacturer) {
      updateDirectManufacturerMutation.mutate({
        id: selectedDirectManufacturer.id,
        data,
      });
    } else {
      createDirectManufacturerMutation.mutate(data);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-manufacturers-title">Manufacturer Management</h1>
        <p className="text-muted-foreground">
          Create and manage manufacturing partners
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Manufacturers</CardTitle>
              <CardDescription>
                Create and manage manufacturing partners
              </CardDescription>
            </div>
            <Button onClick={handleAddManufacturer} data-testid="button-add-manufacturer">
              <Plus className="h-4 w-4 mr-2" />
              Add Manufacturer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingDirectManufacturers ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : directManufacturers && directManufacturers.length > 0 ? (
            <div className="space-y-4">
              {directManufacturers.map((manufacturer) => (
                <Card key={manufacturer.id} className="mb-4">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {manufacturer.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {manufacturer.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {manufacturer.phone}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={manufacturer.isActive ? "default" : "secondary"}>
                          {manufacturer.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          {manufacturer.createdAt ? new Date(manufacturer.createdAt).toLocaleDateString() : "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        {manufacturer.address}
                      </div>
                      {manufacturer.description && (
                        <p className="text-sm text-muted-foreground">{manufacturer.description}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDirectManufacturer(manufacturer)}
                          data-testid={`button-edit-manufacturer-${manufacturer.id}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDirectManufacturer(manufacturer.id)}
                          data-testid={`button-delete-manufacturer-${manufacturer.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Manufacturers</h3>
              <p className="text-muted-foreground mb-4">
                Create manufacturers to get started with production management.
              </p>
              <Button onClick={handleAddManufacturer} data-testid="button-add-first-manufacturer">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Manufacturer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Add/Edit Direct Manufacturer Dialog */}
      <Dialog open={isAddManufacturerDialogOpen || isEditManufacturerDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddManufacturerDialogOpen(false);
          setIsEditManufacturerDialogOpen(false);
          setSelectedDirectManufacturer(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDirectManufacturer ? "Edit Manufacturer" : "Add Manufacturer"}
            </DialogTitle>
            <DialogDescription>
              {selectedDirectManufacturer 
                ? "Update manufacturer information" 
                : "Create a new manufacturer for direct management"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitDirectManufacturer)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company name"
                        {...field}
                        data-testid="input-manufacturer-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company address"
                        {...field}
                        data-testid="input-manufacturer-address"
                      />
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
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        {...field}
                        data-testid="input-manufacturer-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter phone number"
                        {...field}
                        data-testid="input-manufacturer-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter description (optional)"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-manufacturer-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter photo URL (optional)"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-manufacturer-photo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddManufacturerDialogOpen(false);
                    setIsEditManufacturerDialogOpen(false);
                    setSelectedDirectManufacturer(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createDirectManufacturerMutation.isPending || updateDirectManufacturerMutation.isPending}
                  data-testid="button-save-manufacturer"
                >
                  {createDirectManufacturerMutation.isPending || updateDirectManufacturerMutation.isPending 
                    ? "Saving..." 
                    : selectedDirectManufacturer 
                      ? "Update Manufacturer" 
                      : "Create Manufacturer"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}