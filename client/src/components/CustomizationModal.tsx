import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  TreeDeciduous, 
  Droplet, 
  Sofa, 
  Wrench, 
  Sparkles,
  Package,
  Rocket,
  ImageIcon,
  Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CustomizationModalProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Material {
  id: string;
  materialId: string;
  materialName: string;
  materialType: string;
  materialSubType: string | null;
  materialDescription?: string;
  priceModifier: string;
  priceMultiplier: string;
  textureUrl?: string;
  color?: string;
  stock: number;
  isEnabled: boolean;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

interface AvailableMaterial {
  id: string;
  name: string;
  type: string;
  subType: string;
  description: string;
  priceModifier: string;
  priceMultiplier: string;
  textureUrl: string;
  color: string;
  stock: number;
  isAvailable: boolean;
}

export function CustomizationModal({ productId, productName, open, onOpenChange }: CustomizationModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("wood-types");
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [selectorSubType, setSelectorSubType] = useState("");
  const [selectorTitle, setSelectorTitle] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  // Fetch customizations for this product
  const { data: customizationsData, isLoading } = useQuery<{ materials: Record<string, Material[]>, allMaterials: Material[] }>({
    queryKey: ['/api/admin/customizations', productId],
    enabled: open,
  });

  // Fetch customization status
  const { data: statusData } = useQuery<{ status: string; counts: Record<string, number>; activity: Record<string, number> }>({
    queryKey: ['/api/admin/customizations', productId, 'status'],
    enabled: open,
  });

  // Fetch available materials from centralized library
  const { data: availableMaterialsData, isLoading: isLoadingAvailableMaterials } = useQuery<{ materials: AvailableMaterial[] }>({
    queryKey: ['/api/admin/materials/all', selectorSubType],
    enabled: showMaterialSelector && !!selectorSubType,
  });

  // Get materials that aren't already assigned to this product
  const unassignedMaterials = availableMaterialsData?.materials.filter(
    (availableMaterial) => {
      const alreadyAssigned = customizationsData?.allMaterials.some(
        (assigned) => assigned.materialId === availableMaterial.id
      );
      return !alreadyAssigned;
    }
  ) || [];

  // Assign materials mutation
  const assignMaterialsMutation = useMutation({
    mutationFn: async (materialIds: string[]) => {
      const response = await apiRequest("POST", `/api/admin/customizations/${productId}/materials`, {
        materialIds
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customizations', productId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customizations', productId, 'status'] });
      toast({
        title: "Success",
        description: `${selectedMaterialIds.length} material(s) added successfully`,
      });
      setShowMaterialSelector(false);
      setSelectedMaterialIds([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign materials",
        variant: "destructive",
      });
    },
  });

  // Update material stock mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AvailableMaterial> }) => {
      const response = await apiRequest("PATCH", `/api/admin/materials/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customizations', productId] });
      toast({
        title: "Success",
        description: "Material stock updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update material",
        variant: "destructive",
      });
    },
  });

  // Toggle material enabled/disabled
  const toggleMaterialMutation = useMutation({
    mutationFn: async ({ assignmentId, isEnabled }: { assignmentId: string; isEnabled: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/customizations/${productId}/materials/${assignmentId}`, {
        isEnabled
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customizations', productId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customizations', productId, 'status'] });
    },
  });

  // Publish customizations
  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/customizations/${productId}/publish`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Published!",
        description: "Customizations are now live for users",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to publish customizations",
        variant: "destructive",
      });
    },
  });

  const handleUpdateStock = (materialId: string, stock: number) => {
    updateMaterialMutation.mutate({ 
      id: materialId, 
      data: { stock: stock }
    });
  };

  const handleOpenMaterialSelector = (subType: string, title: string) => {
    setSelectorSubType(subType);
    setSelectorTitle(title);
    setSelectedMaterialIds([]);
    setShowMaterialSelector(true);
  };

  const handleAssignMaterials = () => {
    if (selectedMaterialIds.length === 0) {
      toast({
        title: "No materials selected",
        description: "Please select at least one material to add",
        variant: "destructive",
      });
      return;
    }
    assignMaterialsMutation.mutate(selectedMaterialIds);
  };

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  const renderMaterialSection = (subType: string, title: string, icon: any) => {
    const Icon = icon;
    const materials = customizationsData?.materials[subType] || [];
    const count = statusData?.counts[subType] || 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{title}</h3>
            <Badge variant="outline">{count} options</Badge>
          </div>
          <Button
            size="sm"
            onClick={() => handleOpenMaterialSelector(subType, title)}
            data-testid={`button-add-${subType}`}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add {title.split(' ')[0]}
          </Button>
        </div>

        <div className="space-y-2">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No {title.toLowerCase()} configured</p>
          ) : (
            materials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <Switch
                    checked={material.isEnabled}
                    onCheckedChange={(checked) => toggleMaterialMutation.mutate({ assignmentId: material.id, isEnabled: checked })}
                    data-testid={`switch-material-${material.id}`}
                  />
                  {material.color && (
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: material.color }}
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{material.materialName}</p>
                    <p className="text-sm text-muted-foreground">
                      {material.priceModifier !== '0' && `+${material.priceModifier}`}
                      {material.materialDescription && ` • ${material.materialDescription}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={material.stock}
                      onChange={(e) => handleUpdateStock(material.materialId, parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                      data-testid={`input-stock-${material.id}`}
                    />
                  </div>
                  <Badge variant={material.isDefault ? "default" : "outline"} className="text-xs">
                    {material.isDefault ? "Default" : ""}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productName} - Customization Options</DialogTitle>
            <DialogDescription>
              Manage wood types, stains, fabrics, hardware, and finishes for this product
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="wood-types" data-testid="tab-wood-types">Wood Types</TabsTrigger>
                <TabsTrigger value="wood-stain" data-testid="tab-wood-stains">Stains</TabsTrigger>
                <TabsTrigger value="upholstery" data-testid="tab-upholstery">Fabrics</TabsTrigger>
                <TabsTrigger value="hardware" data-testid="tab-hardware">Hardware</TabsTrigger>
                <TabsTrigger value="surface-finish" data-testid="tab-finishes">Finishes</TabsTrigger>
              </TabsList>

              <TabsContent value="wood-types" className="space-y-4 mt-4">
                {renderMaterialSection("wood-type", "Wood Types", TreeDeciduous)}
              </TabsContent>

              <TabsContent value="wood-stain" className="space-y-4 mt-4">
                {renderMaterialSection("wood-stain", "Wood Stains & Finishes", Droplet)}
              </TabsContent>

              <TabsContent value="upholstery" className="space-y-4 mt-4">
                {renderMaterialSection("upholstery", "Fabric Materials", Sofa)}
              </TabsContent>

              <TabsContent value="hardware" className="space-y-4 mt-4">
                {renderMaterialSection("hardware-finish", "Hardware Options", Wrench)}
              </TabsContent>

              <TabsContent value="surface-finish" className="space-y-4 mt-4">
                {renderMaterialSection("surface-finish", "Surface Finishes", Sparkles)}
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {statusData && (
                <span>
                  Views (24h): {statusData.activity.view || 0} • 
                  Customizations: {statusData.activity.customize || 0}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button 
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                data-testid="button-publish"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Publish to Users
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Selector Dialog */}
      <Dialog open={showMaterialSelector} onOpenChange={setShowMaterialSelector}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select {selectorTitle}</DialogTitle>
            <DialogDescription>
              Choose materials from your library to assign to this product
            </DialogDescription>
          </DialogHeader>

          {isLoadingAvailableMaterials ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-20 w-20" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : unassignedMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No materials available</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {availableMaterialsData?.materials.length === 0
                  ? "Please add materials in the Assets section first."
                  : "All available materials have already been assigned to this product."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {unassignedMaterials.map((material) => (
                  <div
                    key={material.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMaterialIds.includes(material.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => toggleMaterialSelection(material.id)}
                    data-testid={`material-option-${material.id}`}
                  >
                    <Checkbox
                      checked={selectedMaterialIds.includes(material.id)}
                      onCheckedChange={() => toggleMaterialSelection(material.id)}
                      data-testid={`checkbox-material-${material.id}`}
                    />
                    
                    {material.textureUrl ? (
                      <img
                        src={material.textureUrl}
                        alt={material.name}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ) : material.color ? (
                      <div
                        className="w-20 h-20 rounded border-2"
                        style={{ backgroundColor: material.color }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted flex items-center justify-center rounded border">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1">
                      <h4 className="font-semibold">{material.name}</h4>
                      {material.description && (
                        <p className="text-sm text-muted-foreground mt-1">{material.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {material.priceModifier && material.priceModifier !== "0" && (
                          <Badge variant="secondary" className="text-xs">
                            +${material.priceModifier}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Stock: {material.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Need to add a new material? Go to <strong>Assets</strong> in the sidebar to manage your material library.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedMaterialIds.length > 0 && `${selectedMaterialIds.length} material(s) selected`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMaterialSelector(false)}
                data-testid="button-cancel-selector"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignMaterials}
                disabled={selectedMaterialIds.length === 0 || assignMaterialsMutation.isPending}
                data-testid="button-assign-materials"
              >
                Add Selected Materials
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
