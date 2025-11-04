import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleUploader } from "@/components/SimpleUploader";

interface Asset {
  id: string;
  name: string;
  type: string;
  category: string;
  color?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetFormData {
  name: string;
  type: string;
  color?: string;
  imageUrl?: string;
}

interface AssetsResponse {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const assetCategories = [
  { value: "wood", label: "Wood" },
  { value: "stain", label: "Stain" },
  { value: "upholstery", label: "Upholstery" },
  { value: "hardware", label: "Hardware" },
  { value: "finish", label: "Finish" },
];

// Default type options for each category
const defaultTypeOptions: Record<string, string[]> = {
  wood: ["Teak", "Oak", "Mahogany", "Walnut", "Pine", "Cherry", "Maple", "Bamboo"],
  stain: ["Natural", "Light Oak", "Dark Walnut", "Ebony", "Cherry", "Mahogany", "Espresso"],
  upholstery: ["Leather", "Fabric", "Velvet", "Linen", "Cotton", "Microfiber", "Suede"],
  hardware: ["Brass", "Chrome", "Stainless Steel", "Bronze", "Nickel", "Copper", "Iron"],
  finish: ["Matte", "Glossy", "Satin", "Oil", "Wax", "Lacquer", "Varnish"],
};

export default function AdminAssets() {
  const [activeTab, setActiveTab] = useState("wood");
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [newAsset, setNewAsset] = useState<AssetFormData>({
    name: '',
    type: '',
    color: '',
  });
  const [isAddCustomTypeDialogOpen, setIsAddCustomTypeDialogOpen] = useState(false);
  const [isEditCustomTypeDialogOpen, setIsEditCustomTypeDialogOpen] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [customTypes, setCustomTypes] = useState<Record<string, string[]>>({
    wood: [],
    stain: [],
    upholstery: [],
    hardware: [],
    finish: [],
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  // Fetch assets for the active tab
  const { data: assetsData, isLoading } = useQuery<AssetsResponse>({
    queryKey: ["/api/admin/assets", activeTab],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/assets?category=${activeTab}`);
      return response.json();
    },
  });

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async (data: AssetFormData & { category: string }) => {
      const response = await apiRequest("POST", "/api/admin/assets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assets"] });
      toast({
        title: "Success",
        description: "Asset created successfully",
      });
      setIsCreateDialogOpen(false);
      setNewAsset({ name: '', type: '', color: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create asset",
        variant: "destructive",
      });
    },
  });

  // Update asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: async ({ assetId, data }: { assetId: string; data: Partial<AssetFormData> }) => {
      const response = await apiRequest("PATCH", `/api/admin/assets/${assetId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assets"] });
      toast({
        title: "Success",
        description: "Asset updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingAsset(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update asset",
        variant: "destructive",
      });
    },
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/assets/${assetId}`);
      // 204 No Content responses don't have a body
      if (response.status === 204) {
        return null;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/assets"] });
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeletingAsset(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete asset",
        variant: "destructive",
      });
    },
  });

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsEditDialogOpen(true);
  };

  const handleDeleteAsset = (asset: Asset) => {
    setDeletingAsset(asset);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAsset = () => {
    if (deletingAsset) {
      deleteAssetMutation.mutate(deletingAsset.id);
    }
  };

  const handleUpdateAsset = () => {
    if (editingAsset) {
      updateAssetMutation.mutate({
        assetId: editingAsset.id,
        data: {
          name: editingAsset.name,
          type: editingAsset.type,
          color: editingAsset.color,
          imageUrl: editingAsset.imageUrl,
        },
      });
    }
  };

  const handleCreateAsset = () => {
    createAssetMutation.mutate({
      ...newAsset,
      category: activeTab,
    });
  };

  const handleImageUpload = (url: string, isEditing: boolean = false) => {
    if (isEditing && editingAsset) {
      setEditingAsset({ ...editingAsset, imageUrl: url });
    } else {
      setNewAsset({ ...newAsset, imageUrl: url });
    }
  };

  const handleAddCustomType = () => {
    if (!customTypeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a type name",
        variant: "destructive",
      });
      return;
    }

    const category = isEditMode && editingAsset ? editingAsset.category : activeTab;
    
    // Check if type already exists
    const allTypes = [...defaultTypeOptions[category], ...customTypes[category]];
    if (allTypes.includes(customTypeInput.trim())) {
      toast({
        title: "Error",
        description: "This type already exists",
        variant: "destructive",
      });
      return;
    }

    // Add custom type to the list
    setCustomTypes({
      ...customTypes,
      [category]: [...customTypes[category], customTypeInput.trim()],
    });

    // Set the newly added type as selected
    if (isEditMode && editingAsset) {
      setEditingAsset({ ...editingAsset, type: customTypeInput.trim() });
      setIsEditCustomTypeDialogOpen(false);
    } else {
      setNewAsset({ ...newAsset, type: customTypeInput.trim() });
      setIsAddCustomTypeDialogOpen(false);
    }

    setCustomTypeInput('');
    toast({
      title: "Success",
      description: "Custom type added successfully",
    });
  };

  // Get all available types for a category (default + custom)
  const getAvailableTypes = (category: string) => {
    return [...defaultTypeOptions[category], ...(customTypes[category] || [])];
  };

  const renderAssetsTable = (assets: Asset[] | undefined) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!assets || assets.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No assets found. Create your first asset to get started.
        </div>
      );
    }

    const showColorColumn = activeTab === 'stain' || activeTab === 'upholstery';
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            {showColorColumn && <TableHead>Color</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id} data-testid={`asset-row-${asset.id}`}>
              <TableCell>
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="h-12 w-12 object-cover rounded"
                    data-testid={`asset-image-${asset.id}`}
                  />
                ) : (
                  <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell data-testid={`asset-name-${asset.id}`}>{asset.name}</TableCell>
              <TableCell data-testid={`asset-type-${asset.id}`}>{asset.type}</TableCell>
              {showColorColumn && (
                <TableCell data-testid={`asset-color-${asset.id}`}>
                  {asset.color ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border border-border" 
                        style={{ backgroundColor: asset.color }}
                      />
                      <span className="text-sm text-muted-foreground">{asset.color}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAsset(asset)}
                    data-testid={`button-edit-${asset.id}`}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAsset(asset)}
                    data-testid={`button-delete-${asset.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Assets</h1>
          <p className="text-muted-foreground">Manage your furniture assets and materials</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList data-testid="tabs-list">
                {assetCategories.map((category) => (
                  <TabsTrigger
                    key={category.value}
                    value={category.value}
                    data-testid={`tab-${category.value}`}
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                data-testid={`button-add-${activeTab}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Asset
              </Button>
            </div>

            {assetCategories.map((category) => (
              <TabsContent key={category.value} value={category.value} data-testid={`tab-content-${category.value}`}>
                {renderAssetsTable(assetsData?.assets)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Asset Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-asset">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Create a new asset for the {activeTab} category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">{activeTab === 'wood' ? 'Wood Type' : 'Name'}</Label>
              <Input
                id="create-name"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                placeholder={activeTab === 'wood' ? 'Enter wood type' : 'Enter asset name'}
                data-testid="input-name"
              />
            </div>
            <div>
              <Label htmlFor="create-type">Type</Label>
              <div className="flex gap-2">
                <Select
                  value={newAsset.type}
                  onValueChange={(value) => {
                    setNewAsset({ ...newAsset, type: value });
                  }}
                >
                  <SelectTrigger data-testid="select-type" className="flex-1">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTypes(activeTab).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setIsEditMode(false);
                    setIsAddCustomTypeDialogOpen(true);
                  }}
                  data-testid="button-add-custom"
                >
                  + Add Custom Type
                </Button>
              </div>
            </div>
            {(activeTab === 'stain' || activeTab === 'upholstery') && (
              <div>
                <Label htmlFor="create-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="create-color"
                    type="color"
                    value={newAsset.color || '#000000'}
                    onChange={(e) => setNewAsset({ ...newAsset, color: e.target.value })}
                    className="w-20 h-10 p-1 cursor-pointer"
                    data-testid="input-color"
                  />
                  <Input
                    type="text"
                    value={newAsset.color || ''}
                    onChange={(e) => setNewAsset({ ...newAsset, color: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                    data-testid="input-color-hex"
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Image</Label>
              <SimpleUploader
                onUploadSuccess={(url) => handleImageUpload(url, false)}
                allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/jpg']}
                maxFileSize={5 * 1024 * 1024}
                className="w-full"
              >
                Upload Image
              </SimpleUploader>
              {newAsset.imageUrl && (
                <div className="mt-2">
                  <img
                    src={newAsset.imageUrl}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded"
                    data-testid="preview-image"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewAsset({ name: '', type: '', color: '' });
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAsset}
              disabled={!newAsset.name || !newAsset.type || createAssetMutation.isPending}
              data-testid="button-create"
            >
              {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-asset">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update the asset details.
            </DialogDescription>
          </DialogHeader>
          {editingAsset && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">{editingAsset.category === 'wood' ? 'Wood Type' : 'Name'}</Label>
                <Input
                  id="edit-name"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  placeholder={editingAsset.category === 'wood' ? 'Enter wood type' : 'Enter asset name'}
                  data-testid="input-edit-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <div className="flex gap-2">
                  <Select
                    value={editingAsset.type}
                    onValueChange={(value) => {
                      setEditingAsset({ ...editingAsset, type: value });
                    }}
                  >
                    <SelectTrigger data-testid="select-edit-type" className="flex-1">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTypes(editingAsset.category).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      setIsEditMode(true);
                      setIsEditCustomTypeDialogOpen(true);
                    }}
                    data-testid="button-edit-add-custom"
                  >
                    + Add Custom Type
                  </Button>
                </div>
              </div>
              {(editingAsset.category === 'stain' || editingAsset.category === 'upholstery') && (
                <div>
                  <Label htmlFor="edit-color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-color"
                      type="color"
                      value={editingAsset.color || '#000000'}
                      onChange={(e) => setEditingAsset({ ...editingAsset, color: e.target.value })}
                      className="w-20 h-10 p-1 cursor-pointer"
                      data-testid="input-edit-color"
                    />
                    <Input
                      type="text"
                      value={editingAsset.color || ''}
                      onChange={(e) => setEditingAsset({ ...editingAsset, color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                      data-testid="input-edit-color-hex"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label>Image</Label>
                <SimpleUploader
                  onUploadSuccess={(url) => handleImageUpload(url, true)}
                  allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/jpg']}
                  maxFileSize={5 * 1024 * 1024}
                  className="w-full"
                >
                  {editingAsset.imageUrl ? "Change Image" : "Upload Image"}
                </SimpleUploader>
                {editingAsset.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={editingAsset.imageUrl}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded"
                      data-testid="preview-edit-image"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingAsset(null);
              }}
              data-testid="button-edit-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAsset}
              disabled={!editingAsset?.name || !editingAsset?.type || updateAssetMutation.isPending}
              data-testid="button-save"
            >
              {updateAssetMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the asset "{deletingAsset?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAsset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              {deleteAssetMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Custom Type Dialog (for Create) */}
      <Dialog open={isAddCustomTypeDialogOpen} onOpenChange={setIsAddCustomTypeDialogOpen}>
        <DialogContent data-testid="dialog-add-custom-type">
          <DialogHeader>
            <DialogTitle>Add Custom Type</DialogTitle>
            <DialogDescription>
              Enter a new custom type for {assetCategories.find(c => c.value === activeTab)?.label}. It will be added to the dropdown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-type-input">Type Name</Label>
              <Input
                id="custom-type-input"
                value={customTypeInput}
                onChange={(e) => setCustomTypeInput(e.target.value)}
                placeholder="Enter type name"
                data-testid="input-custom-type-name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomType();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCustomTypeDialogOpen(false);
                setCustomTypeInput('');
              }}
              data-testid="button-custom-type-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomType}
              disabled={!customTypeInput.trim()}
              data-testid="button-custom-type-add"
            >
              Add Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Custom Type Dialog (for Edit) */}
      <Dialog open={isEditCustomTypeDialogOpen} onOpenChange={setIsEditCustomTypeDialogOpen}>
        <DialogContent data-testid="dialog-edit-custom-type">
          <DialogHeader>
            <DialogTitle>Add Custom Type</DialogTitle>
            <DialogDescription>
              Enter a new custom type for {editingAsset && assetCategories.find(c => c.value === editingAsset.category)?.label}. It will be added to the dropdown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-custom-type-input">Type Name</Label>
              <Input
                id="edit-custom-type-input"
                value={customTypeInput}
                onChange={(e) => setCustomTypeInput(e.target.value)}
                placeholder="Enter type name"
                data-testid="input-edit-custom-type-name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomType();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCustomTypeDialogOpen(false);
                setCustomTypeInput('');
              }}
              data-testid="button-edit-custom-type-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomType}
              disabled={!customTypeInput.trim()}
              data-testid="button-edit-custom-type-add"
            >
              Add Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
