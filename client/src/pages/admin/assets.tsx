import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit2, Trash2, ImageIcon, TreeDeciduous, Droplet, Sofa, Wrench, Sparkles, Lightbulb } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { SimpleUploader } from "@/components/SimpleUploader";
import type { Material } from "@shared/schema";
import { presetsBySubType } from "@shared/materialPresets";

interface MaterialsResponse {
  materials: Material[];
}

interface MaterialFormData {
  name: string;
  type: string;
  subType: string;
  description: string;
  priceModifier: string;
  priceMultiplier: string;
  textureUrl: string;
  color: string;
  isAvailable: boolean;
}

const TAB_CONFIG = [
  {
    id: "wood-type",
    label: "Wood Types",
    icon: TreeDeciduous,
    type: "wood",
    subType: "wood-type",
  },
  {
    id: "wood-stain",
    label: "Wood Stains",
    icon: Droplet,
    type: "wood",
    subType: "wood-stain",
  },
  {
    id: "upholstery",
    label: "Fabrics",
    icon: Sofa,
    type: "fabric",
    subType: "upholstery",
  },
  {
    id: "hardware",
    label: "Hardware",
    icon: Wrench,
    type: "metal",
    subType: "hardware",
  },
  {
    id: "surface-finish",
    label: "Surface Finishes",
    icon: Sparkles,
    type: "finish",
    subType: "surface-finish",
  },
];

export default function AdminAssets() {
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0].id);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [newMaterial, setNewMaterial] = useState<MaterialFormData>({
    name: "",
    type: "wood",
    subType: "wood-type",
    description: "",
    priceModifier: "0",
    priceMultiplier: "1.0",
    textureUrl: "",
    color: "#000000",
    isAvailable: true,
  });
  const { toast } = useToast();

  const currentTabConfig = TAB_CONFIG.find((tab) => tab.id === activeTab) || TAB_CONFIG[0];

  const { data: materialsData, isLoading } = useQuery<MaterialsResponse>({
    queryKey: ["/api/admin/materials/all", currentTabConfig.subType],
    queryFn: async () => {
      const params = new URLSearchParams({
        subType: currentTabConfig.subType,
      });
      const response = await apiRequest("GET", `/api/admin/materials/all?${params.toString()}`);
      return response.json();
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const response = await apiRequest("POST", "/api/admin/materials", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/materials/all"] });
      toast({
        title: "Success",
        description: "Material created successfully",
      });
      setIsCreateDialogOpen(false);
      resetNewMaterial();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create material",
        variant: "destructive",
      });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async ({ materialId, data }: { materialId: string; data: Partial<Material> }) => {
      const response = await apiRequest("PATCH", `/api/admin/materials/${materialId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/materials/all"] });
      toast({
        title: "Success",
        description: "Material updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingMaterial(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update material",
        variant: "destructive",
      });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/materials/${materialId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/materials/all"] });
      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete material",
        variant: "destructive",
      });
    },
  });

  const resetNewMaterial = () => {
    setNewMaterial({
      name: "",
      type: currentTabConfig.type,
      subType: currentTabConfig.subType,
      description: "",
      priceModifier: "0",
      priceMultiplier: "1.0",
      textureUrl: "",
      color: "#000000",
      isAvailable: true,
    });
  };

  const handlePresetSelect = (presetName: string) => {
    const presetsForTab = presetsBySubType[currentTabConfig.subType] || [];
    const preset = presetsForTab.find((p) => p.name === presetName);
    
    if (preset) {
      setNewMaterial({
        name: preset.name,
        type: currentTabConfig.type,
        subType: currentTabConfig.subType,
        description: preset.description,
        priceModifier: preset.priceModifier,
        priceMultiplier: "1.0",
        textureUrl: preset.textureUrl || "",
        color: preset.color || "#000000",
        isAvailable: true,
      });
    }
  };

  const handleCreateMaterial = () => {
    const materialData = {
      ...newMaterial,
      type: currentTabConfig.type,
      subType: currentTabConfig.subType,
    };
    createMaterialMutation.mutate(materialData);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMaterial = () => {
    if (!editingMaterial) return;

    updateMaterialMutation.mutate({
      materialId: editingMaterial.id,
      data: editingMaterial,
    });
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      deleteMaterialMutation.mutate(materialId);
    }
  };

  const handleOpenCreateDialog = () => {
    setNewMaterial({
      name: "",
      type: currentTabConfig.type,
      subType: currentTabConfig.subType,
      description: "",
      priceModifier: "0",
      priceMultiplier: "1.0",
      textureUrl: "",
      color: "#000000",
      isAvailable: true,
    });
    setIsCreateDialogOpen(true);
  };

  const materials = materialsData?.materials || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-assets-title">
            Assets
          </h1>
          <p className="text-muted-foreground" data-testid="text-assets-description">
            Manage your material library
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog} data-testid="button-add-material">
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" data-testid="tabs-materials">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-list-materials">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2"
                data-testid={`tab-trigger-${tab.id}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TAB_CONFIG.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4" data-testid={`tab-content-${tab.id}`}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : materials.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2" data-testid={`text-no-materials-${tab.id}`}>
                    No {tab.label} Yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first {tab.label.toLowerCase()} to get started
                  </p>
                  <Button onClick={handleOpenCreateDialog} data-testid={`button-add-first-${tab.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {tab.label}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {materials.map((material) => (
                  <Card key={material.id} data-testid={`card-material-${material.id}`}>
                    <CardHeader className="p-0">
                      {material.textureUrl ? (
                        <img
                          src={material.textureUrl}
                          alt={material.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                          data-testid={`img-material-${material.id}`}
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg" data-testid={`text-material-name-${material.id}`}>
                            {material.name}
                          </h3>
                          {material.color && (
                            <div
                              className="w-6 h-6 rounded-full border-2 border-border"
                              style={{ backgroundColor: material.color }}
                              data-testid={`color-swatch-${material.id}`}
                            />
                          )}
                        </div>
                        {material.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-material-description-${material.id}`}>
                            {material.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {material.priceModifier && material.priceModifier !== "0" && (
                          <Badge variant="outline" data-testid={`badge-price-modifier-${material.id}`}>
                            {material.priceModifier.startsWith("+") || material.priceModifier.startsWith("-")
                              ? material.priceModifier
                              : `+${material.priceModifier}`}
                          </Badge>
                        )}
                        {material.priceMultiplier && material.priceMultiplier !== "1.0" && material.priceMultiplier !== "1" && (
                          <Badge variant="outline" data-testid={`badge-price-multiplier-${material.id}`}>
                            ×{material.priceMultiplier}
                          </Badge>
                        )}
                        <Badge
                          variant={material.isAvailable ? "default" : "secondary"}
                          className={material.isAvailable ? "bg-green-100 text-green-800" : ""}
                          data-testid={`badge-availability-${material.id}`}
                        >
                          {material.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditMaterial(material)}
                          data-testid={`button-edit-${material.id}`}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteMaterial(material.id)}
                          data-testid={`button-delete-${material.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Material Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-material">
          <DialogHeader>
            <DialogTitle data-testid="text-create-material-title">Add New Material</DialogTitle>
            <DialogDescription data-testid="text-create-material-description">
              Add a new material to the {currentTabConfig.label} library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preset Selection */}
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                Quick start: Select a preset to auto-fill common {currentTabConfig.label.toLowerCase()} with default values
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="preset-select">Select Preset (Optional)</Label>
              <Select onValueChange={handlePresetSelect}>
                <SelectTrigger id="preset-select" data-testid="select-preset">
                  <SelectValue placeholder={`Choose a preset ${currentTabConfig.label.toLowerCase().slice(0, -1)}...`} />
                </SelectTrigger>
                <SelectContent>
                  {(presetsBySubType[currentTabConfig.subType] || []).map((preset) => (
                    <SelectItem key={preset.name} value={preset.name} data-testid={`preset-option-${preset.name}`}>
                      <div className="flex items-center gap-2">
                        {preset.color && (
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.color }}
                          />
                        )}
                        <span>{preset.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a preset will auto-fill the form below. You can still customize any field.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                placeholder="Enter material name"
                data-testid="input-create-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                placeholder="Enter material description"
                rows={3}
                data-testid="input-create-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-price-modifier">Price Modifier</Label>
                <Input
                  id="create-price-modifier"
                  value={newMaterial.priceModifier}
                  onChange={(e) => setNewMaterial({ ...newMaterial, priceModifier: e.target.value })}
                  placeholder="e.g., +150 or +15%"
                  data-testid="input-create-price-modifier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-price-multiplier">Price Multiplier *</Label>
                <Input
                  id="create-price-multiplier"
                  value={newMaterial.priceMultiplier}
                  onChange={(e) => setNewMaterial({ ...newMaterial, priceMultiplier: e.target.value })}
                  placeholder="e.g., 1.2"
                  data-testid="input-create-price-multiplier"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="create-color"
                  type="color"
                  value={newMaterial.color}
                  onChange={(e) => setNewMaterial({ ...newMaterial, color: e.target.value })}
                  className="w-20 h-10"
                  data-testid="input-create-color"
                />
                <Input
                  value={newMaterial.color}
                  onChange={(e) => setNewMaterial({ ...newMaterial, color: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                  data-testid="input-create-color-hex"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Texture Image</Label>
              {newMaterial.textureUrl && (
                <div className="mb-2">
                  <img
                    src={newMaterial.textureUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                    data-testid="img-create-texture-preview"
                  />
                </div>
              )}
              <SimpleUploader
                onUploadSuccess={(url) => setNewMaterial({ ...newMaterial, textureUrl: url })}
                allowedTypes={["image/jpeg", "image/png", "image/webp"]}
                maxFileSize={5 * 1024 * 1024}
              >
                Upload Texture
              </SimpleUploader>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="create-available">Available</Label>
                <p className="text-sm text-muted-foreground">Make this material available for use</p>
              </div>
              <Switch
                id="create-available"
                checked={newMaterial.isAvailable}
                onCheckedChange={(checked) => setNewMaterial({ ...newMaterial, isAvailable: checked })}
                data-testid="switch-create-available"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMaterial}
              disabled={!newMaterial.name || !newMaterial.priceMultiplier || createMaterialMutation.isPending}
              data-testid="button-submit-create"
            >
              {createMaterialMutation.isPending ? "Creating..." : "Create Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Material Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-material">
          <DialogHeader>
            <DialogTitle data-testid="text-edit-material-title">Edit Material</DialogTitle>
            <DialogDescription data-testid="text-edit-material-description">
              Update the material details
            </DialogDescription>
          </DialogHeader>

          {editingMaterial && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  placeholder="Enter material name"
                  data-testid="input-edit-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingMaterial.description || ""}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                  placeholder="Enter material description"
                  rows={3}
                  data-testid="input-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price-modifier">Price Modifier</Label>
                  <Input
                    id="edit-price-modifier"
                    value={editingMaterial.priceModifier || ""}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, priceModifier: e.target.value })}
                    placeholder="e.g., +150 or +15%"
                    data-testid="input-edit-price-modifier"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-price-multiplier">Price Multiplier *</Label>
                  <Input
                    id="edit-price-multiplier"
                    value={editingMaterial.priceMultiplier}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, priceMultiplier: e.target.value })}
                    placeholder="e.g., 1.2"
                    data-testid="input-edit-price-multiplier"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={editingMaterial.color || "#000000"}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, color: e.target.value })}
                    className="w-20 h-10"
                    data-testid="input-edit-color"
                  />
                  <Input
                    value={editingMaterial.color || "#000000"}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, color: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                    data-testid="input-edit-color-hex"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texture Image</Label>
                {editingMaterial.textureUrl && (
                  <div className="mb-2">
                    <img
                      src={editingMaterial.textureUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                      data-testid="img-edit-texture-preview"
                    />
                  </div>
                )}
                <SimpleUploader
                  onUploadSuccess={(url) => setEditingMaterial({ ...editingMaterial, textureUrl: url })}
                  allowedTypes={["image/jpeg", "image/png", "image/webp"]}
                  maxFileSize={5 * 1024 * 1024}
                >
                  {editingMaterial.textureUrl ? "Change Texture" : "Upload Texture"}
                </SimpleUploader>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-available">Available</Label>
                  <p className="text-sm text-muted-foreground">Make this material available for use</p>
                </div>
                <Switch
                  id="edit-available"
                  checked={editingMaterial.isAvailable ?? true}
                  onCheckedChange={(checked) => setEditingMaterial({ ...editingMaterial, isAvailable: checked })}
                  data-testid="switch-edit-available"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMaterial}
              disabled={
                !editingMaterial?.name ||
                !editingMaterial?.priceMultiplier ||
                updateMaterialMutation.isPending
              }
              data-testid="button-submit-edit"
            >
              {updateMaterialMutation.isPending ? "Updating..." : "Update Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
