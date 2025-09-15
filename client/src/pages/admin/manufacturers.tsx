import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface ManufacturerProfile {
  id: string;
  userId: string;
  companyName: string;
  companyAddress: string;
  phone: string;
  experience: string;
  specialties: string;
  portfolioUrls?: string;
  businessLicense?: string;
  certifications?: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
  };
}

interface ApprovalData {
  notes?: string;
}

interface RejectionData {
  reason: string;
  notes?: string;
}


export default function AdminManufacturers() {
  const [selectedProfile, setSelectedProfile] = useState<ManufacturerProfile | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  
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

  // Fetch pending applications
  const { data: pendingApplications, isLoading: isLoadingPending } = useQuery<ManufacturerProfile[]>({
    queryKey: ["/api/admin/manufacturers/pending"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/manufacturers/pending");
      return response.json();
    },
  });

  // Fetch approved manufacturers
  const { data: approvedManufacturers, isLoading: isLoadingApproved } = useQuery<ManufacturerProfile[]>({
    queryKey: ["/api/admin/manufacturers/approved"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/manufacturers/approved");
      return response.json();
    },
  });

  // Fetch direct manufacturers
  const { data: directManufacturers, isLoading: isLoadingDirectManufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/admin/direct-manufacturers"],
  });

  // Approve manufacturer mutation
  const approveMutation = useMutation({
    mutationFn: async ({ profileId, data }: { profileId: string; data: ApprovalData }) => {
      const response = await apiRequest("PATCH", `/api/admin/manufacturers/${profileId}/approve`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturers/approved"] });
      toast({
        title: "Success",
        description: "Manufacturer approved successfully",
      });
      setIsApprovalDialogOpen(false);
      setApprovalNotes("");
      setSelectedProfile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve manufacturer",
        variant: "destructive",
      });
    },
  });

  // Reject manufacturer mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ profileId, data }: { profileId: string; data: RejectionData }) => {
      const response = await apiRequest("PATCH", `/api/admin/manufacturers/${profileId}/reject`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturers/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manufacturers/approved"] });
      toast({
        title: "Success",
        description: "Manufacturer application rejected",
      });
      setIsRejectionDialogOpen(false);
      setRejectionReason("");
      setRejectionNotes("");
      setSelectedProfile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject manufacturer application",
        variant: "destructive",
      });
    },
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

  const handleApprove = (profile: ManufacturerProfile) => {
    setSelectedProfile(profile);
    setIsApprovalDialogOpen(true);
  };

  const handleReject = (profile: ManufacturerProfile) => {
    setSelectedProfile(profile);
    setIsRejectionDialogOpen(true);
  };

  const handleViewDetails = (profile: ManufacturerProfile) => {
    setSelectedProfile(profile);
    setIsDetailsDialogOpen(true);
  };

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

  const confirmApproval = () => {
    if (selectedProfile) {
      approveMutation.mutate({
        profileId: selectedProfile.id,
        data: { notes: approvalNotes || undefined },
      });
    }
  };

  const confirmRejection = () => {
    if (selectedProfile && rejectionReason.trim()) {
      rejectMutation.mutate({
        profileId: selectedProfile.id,
        data: { 
          reason: rejectionReason,
          notes: rejectionNotes || undefined 
        },
      });
    }
  };

  const parseJsonField = (jsonString: string | undefined | null): string[] => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  const ManufacturerCard = ({ profile, isPending = false }: { profile: ManufacturerProfile; isPending?: boolean }) => (
    <Card key={profile.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {profile.companyName}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {profile.user.firstName} {profile.user.lastName}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {profile.user.email}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isPending && (
              <Badge variant={profile.isApproved ? "default" : "destructive"}>
                {profile.isApproved ? "Approved" : "Rejected"}
              </Badge>
            )}
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(profile.createdAt).toLocaleDateString()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            {profile.phone}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {profile.companyAddress}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Specialties:</h4>
          <div className="flex flex-wrap gap-1">
            {parseJsonField(profile.specialties).map((specialty, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(profile)}
            data-testid={`button-view-details-${profile.id}`}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          
          {isPending && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReject(profile)}
                data-testid={`button-reject-${profile.id}`}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(profile)}
                data-testid={`button-approve-${profile.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-manufacturers-title">Manufacturer Management</h1>
        <p className="text-muted-foreground">
          Manage manufacturer applications and approved partners
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Applications
            {pendingApplications && (
              <Badge variant="secondary" className="ml-2">
                {pendingApplications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved Manufacturers
            {approvedManufacturers && (
              <Badge variant="secondary" className="ml-2">
                {approvedManufacturers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="direct" data-testid="tab-direct">
            Direct Manufacturers
            {directManufacturers && (
              <Badge variant="secondary" className="ml-2">
                {directManufacturers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
              <CardDescription>
                Review and approve or reject manufacturer applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPending ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : pendingApplications && pendingApplications.length > 0 ? (
                pendingApplications.map((profile) => (
                  <ManufacturerCard key={profile.id} profile={profile} isPending={true} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
                  <p className="text-muted-foreground">
                    All manufacturer applications have been reviewed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Manufacturers</CardTitle>
              <CardDescription>
                Active manufacturing partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApproved ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : approvedManufacturers && approvedManufacturers.length > 0 ? (
                approvedManufacturers.map((profile) => (
                  <ManufacturerCard key={profile.id} profile={profile} isPending={false} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Approved Manufacturers</h3>
                  <p className="text-muted-foreground">
                    No manufacturers have been approved yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direct" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Direct Manufacturers</CardTitle>
                  <CardDescription>
                    Manufacturers created and managed directly by administrators
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
                  <h3 className="text-lg font-semibold mb-2">No Direct Manufacturers</h3>
                  <p className="text-muted-foreground mb-4">
                    Create manufacturers directly to get started with production management.
                  </p>
                  <Button onClick={handleAddManufacturer} data-testid="button-add-first-manufacturer">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Manufacturer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manufacturer Details</DialogTitle>
            <DialogDescription>
              Complete application information
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Company Name</Label>
                  <p className="text-sm">{selectedProfile.companyName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Contact Person</Label>
                  <p className="text-sm">{selectedProfile.user.firstName} {selectedProfile.user.lastName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Email</Label>
                  <p className="text-sm">{selectedProfile.user.email}</p>
                </div>
                <div>
                  <Label className="font-semibold">Phone</Label>
                  <p className="text-sm">{selectedProfile.phone}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Company Address</Label>
                <p className="text-sm">{selectedProfile.companyAddress}</p>
              </div>

              <div>
                <Label className="font-semibold">Experience</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedProfile.experience}</p>
              </div>

              <div>
                <Label className="font-semibold">Specialties</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {parseJsonField(selectedProfile.specialties).map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {parseJsonField(selectedProfile.portfolioUrls).length > 0 && (
                <div>
                  <Label className="font-semibold">Portfolio URLs</Label>
                  <div className="space-y-1">
                    {parseJsonField(selectedProfile.portfolioUrls).map((url, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parseJsonField(selectedProfile.certifications).length > 0 && (
                <div>
                  <Label className="font-semibold">Certifications</Label>
                  <div className="space-y-1">
                    {parseJsonField(selectedProfile.certifications).map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span className="text-sm">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProfile.businessLicense && (
                <div>
                  <Label className="font-semibold">Business License</Label>
                  <p className="text-sm">{selectedProfile.businessLicense}</p>
                </div>
              )}

              {selectedProfile.notes && (
                <div>
                  <Label className="font-semibold">Additional Notes</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedProfile.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Manufacturer</DialogTitle>
            <DialogDescription>
              Approve {selectedProfile?.companyName} as a manufacturing partner
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                data-testid="input-approval-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmApproval} 
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approval"
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Reject the application from {selectedProfile?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={!rejectionReason.trim() ? "border-red-500" : ""}
                data-testid="input-rejection-reason"
              />
            </div>
            
            <div>
              <Label htmlFor="rejection-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="rejection-notes"
                placeholder="Add any additional notes..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                data-testid="input-rejection-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmRejection} 
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-rejection"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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