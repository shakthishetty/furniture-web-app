import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Tag, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DiscountCode {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minimumOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  createdAt: string;
}

interface DiscountsResponse {
  discounts: DiscountCode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface NewDiscountData {
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minimumOrderValue?: number;
  maxUses?: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export default function AdminDiscounts() {
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState<NewDiscountData>({
    code: "",
    description: "",
    type: "percentage",
    value: 0,
    minimumOrderValue: undefined,
    maxUses: undefined,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const { toast } = useToast();
  const limit = 20;

  const { data: discountsData, isLoading } = useQuery<DiscountsResponse>({
    queryKey: ["/api/admin/discounts", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiRequest("GET", `/api/admin/discounts?${params.toString()}`);
      return response.json();
    },
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (data: NewDiscountData) => {
      const response = await apiRequest("POST", "/api/admin/discounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({
        title: "Success",
        description: "Discount code created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewDiscount({
        code: "",
        description: "",
        type: "percentage",
        value: 0,
        minimumOrderValue: undefined,
        maxUses: undefined,
        isActive: true,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount code",
        variant: "destructive",
      });
    },
  });

  const updateDiscountMutation = useMutation({
    mutationFn: async ({ discountId, data }: { discountId: string; data: Partial<DiscountCode> }) => {
      const response = await apiRequest("PATCH", `/api/admin/discounts/${discountId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({
        title: "Success",
        description: "Discount code updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingDiscount(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update discount code",
        variant: "destructive",
      });
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (discountId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/discounts/${discountId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
      toast({
        title: "Success",
        description: "Discount code deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete discount code",
        variant: "destructive",
      });
    },
  });

  const handleCreateDiscount = () => {
    createDiscountMutation.mutate(newDiscount);
  };

  const handleEditDiscount = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setIsEditDialogOpen(true);
  };

  const handleUpdateDiscount = (data: Partial<DiscountCode>) => {
    if (editingDiscount) {
      updateDiscountMutation.mutate({ discountId: editingDiscount.id, data });
    }
  };

  const handleDeleteDiscount = (discountId: string) => {
    if (confirm("Are you sure you want to delete this discount code? This action cannot be undone.")) {
      deleteDiscountMutation.mutate(discountId);
    }
  };

  const getStatusBadge = (discount: DiscountCode) => {
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validUntil = new Date(discount.validUntil);
    
    if (!discount.isActive) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    
    if (now < validFrom) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Scheduled</Badge>;
    }
    
    if (now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      return <Badge variant="destructive">Used Up</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  const formatValue = (type: string, value: number) => {
    if (type === "percentage") {
      return `${value}%`;
    }
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-discounts-title">Discount Codes</h1>
          <p className="text-muted-foreground" data-testid="text-discounts-description">
            Manage promotional discount codes and offers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Tag className="h-8 w-8 text-muted-foreground" />
            <span className="text-2xl font-bold" data-testid="text-total-discounts">
              {discountsData?.total || 0}
            </span>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-discount">
                <Plus className="h-4 w-4 mr-2" />
                Create Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" data-testid="dialog-create-discount">
              <DialogHeader>
                <DialogTitle>Create New Discount Code</DialogTitle>
                <DialogDescription>
                  Set up a new promotional discount code
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-code">Discount Code</Label>
                    <Input
                      id="new-code"
                      placeholder="SAVE20"
                      value={newDiscount.code}
                      onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                      data-testid="input-new-code"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-type">Discount Type</Label>
                    <Select value={newDiscount.type} onValueChange={(value: "percentage" | "fixed") => setNewDiscount({ ...newDiscount, type: value })}>
                      <SelectTrigger data-testid="select-new-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-description">Description</Label>
                  <Input
                    id="new-description"
                    placeholder="20% off your order"
                    value={newDiscount.description}
                    onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                    data-testid="input-new-description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-value">
                      {newDiscount.type === "percentage" ? "Percentage" : "Amount ($)"}
                    </Label>
                    <Input
                      id="new-value"
                      type="number"
                      min="0"
                      max={newDiscount.type === "percentage" ? "100" : undefined}
                      value={newDiscount.value}
                      onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) })}
                      data-testid="input-new-value"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-min-order">Minimum Order Value ($)</Label>
                    <Input
                      id="new-min-order"
                      type="number"
                      min="0"
                      placeholder="Optional"
                      value={newDiscount.minimumOrderValue || ""}
                      onChange={(e) => setNewDiscount({ ...newDiscount, minimumOrderValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                      data-testid="input-new-min-order"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-max-uses">Max Uses</Label>
                    <Input
                      id="new-max-uses"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={newDiscount.maxUses || ""}
                      onChange={(e) => setNewDiscount({ ...newDiscount, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                      data-testid="input-new-max-uses"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-active">Active</Label>
                    <Switch
                      id="new-active"
                      checked={newDiscount.isActive}
                      onCheckedChange={(checked) => setNewDiscount({ ...newDiscount, isActive: checked })}
                      data-testid="switch-new-active"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-valid-from">Valid From</Label>
                    <Input
                      id="new-valid-from"
                      type="date"
                      value={newDiscount.validFrom}
                      onChange={(e) => setNewDiscount({ ...newDiscount, validFrom: e.target.value })}
                      data-testid="input-new-valid-from"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-valid-until">Valid Until</Label>
                    <Input
                      id="new-valid-until"
                      type="date"
                      value={newDiscount.validUntil}
                      onChange={(e) => setNewDiscount({ ...newDiscount, validUntil: e.target.value })}
                      data-testid="input-new-valid-until"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateDiscount}
                  disabled={createDiscountMutation.isPending || !newDiscount.code || !newDiscount.value}
                  data-testid="button-save-discount"
                >
                  {createDiscountMutation.isPending ? "Creating..." : "Create Discount"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Discounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Discount Codes</CardTitle>
          <CardDescription>
            {discountsData ? `${discountsData.discounts.length} of ${discountsData.total} discount codes` : "Loading discount codes..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : discountsData?.discounts.length ? (
            <div className="space-y-4">
              {discountsData.discounts.map((discount) => (
                <div key={discount.id} className="flex items-center justify-between p-4 border rounded hover:bg-muted/50" data-testid={`discount-row-${discount.id}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono text-lg" data-testid={`text-discount-code-${discount.id}`}>
                        {discount.code}
                      </span>
                      <span className="font-bold text-primary" data-testid={`text-discount-value-${discount.id}`}>
                        {formatValue(discount.type, discount.value)} off
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-discount-description-${discount.id}`}>
                      {discount.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDate(discount.validFrom)} - {formatDate(discount.validUntil)}
                        </span>
                      </div>
                      <span>
                        Used: {discount.usedCount}{discount.maxUses ? ` / ${discount.maxUses}` : ""}
                      </span>
                      {discount.minimumOrderValue && (
                        <span>Min: ${discount.minimumOrderValue}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(discount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDiscount(discount)}
                      data-testid={`button-edit-discount-${discount.id}`}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDiscount(discount.id)}
                      disabled={deleteDiscountMutation.isPending}
                      data-testid={`button-delete-discount-${discount.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {discountsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4" data-testid="text-page-info">
                    Page {page} of {discountsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === discountsData.totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-discounts">No discount codes found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Discount Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-discount">
          <DialogHeader>
            <DialogTitle>Edit Discount Code</DialogTitle>
            <DialogDescription>
              Update discount code information
            </DialogDescription>
          </DialogHeader>
          
          {editingDiscount && (
            <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Discount Code</Label>
                  <Input
                    id="edit-code"
                    value={editingDiscount.code}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, code: e.target.value.toUpperCase() })}
                    data-testid="input-edit-code"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Discount Type</Label>
                  <Select value={editingDiscount.type} onValueChange={(value: "percentage" | "fixed") => setEditingDiscount({ ...editingDiscount, type: value })}>
                    <SelectTrigger data-testid="select-edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingDiscount.description}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, description: e.target.value })}
                  data-testid="input-edit-description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-value">
                    {editingDiscount.type === "percentage" ? "Percentage" : "Amount ($)"}
                  </Label>
                  <Input
                    id="edit-value"
                    type="number"
                    value={editingDiscount.value}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, value: parseFloat(e.target.value) })}
                    data-testid="input-edit-value"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-min-order">Minimum Order Value ($)</Label>
                  <Input
                    id="edit-min-order"
                    type="number"
                    value={editingDiscount.minimumOrderValue || ""}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, minimumOrderValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                    data-testid="input-edit-min-order"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-max-uses">Max Uses</Label>
                  <Input
                    id="edit-max-uses"
                    type="number"
                    value={editingDiscount.maxUses || ""}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                    data-testid="input-edit-max-uses"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-active">Active</Label>
                  <Switch
                    id="edit-active"
                    checked={editingDiscount.isActive}
                    onCheckedChange={(checked) => setEditingDiscount({ ...editingDiscount, isActive: checked })}
                    data-testid="switch-edit-active"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-valid-from">Valid From</Label>
                  <Input
                    id="edit-valid-from"
                    type="date"
                    value={editingDiscount.validFrom.split('T')[0]}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, validFrom: e.target.value })}
                    data-testid="input-edit-valid-from"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-valid-until">Valid Until</Label>
                  <Input
                    id="edit-valid-until"
                    type="date"
                    value={editingDiscount.validUntil.split('T')[0]}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, validUntil: e.target.value })}
                    data-testid="input-edit-valid-until"
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button 
              onClick={() => handleUpdateDiscount(editingDiscount!)}
              disabled={updateDiscountMutation.isPending}
              data-testid="button-save-discount-edit"
            >
              {updateDiscountMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}