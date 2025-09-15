import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Eye, Building2, Calendar, Mail, Phone, MapPin, Award, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { toast } = useToast();

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
    </div>
  );
}