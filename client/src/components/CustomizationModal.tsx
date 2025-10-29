import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  TreeDeciduous, 
  Droplet, 
  Sofa, 
  Wrench, 
  Sparkles,
  Package,
  Rocket
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

interface MaterialFormData {
  name: string;
  type: string;
  subType: string;
  description?: string;
  priceModifier: string;
  priceMultiplier: string;
  color?: string;
  stock: number;
}

export function CustomizationModal({ productId, productName, open, onOpenChange }: CustomizationModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("wood-types");
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState<MaterialFormData>({
    name: "",
    type: "wood",
    subType: "wood-type",
    description: "",
    priceModifier: "0",
    priceMultiplier: "1.0",
    color: "",
    stock: 0
  });

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

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const response = await apiRequest("POST", "/api/admin/customizations/materials", data);
      return response.json();
    },
    onSuccess: async (material) => {
      // Now assign this material to the product
      await apiRequest("POST", `/api/admin/customizations/${productId}/materials`, {
        materialIds: [material.id]
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customizations', productId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customizations', productId, 'status'] });
      toast({
        title: "Success",
        description: "Material added successfully",
      });
      setShowAddMaterial(false);
      setNewMaterial({
        name: "",
        type: "wood",
        subType: "wood-type",
        description: "",
        priceModifier: "0",
        priceMultiplier: "1.0",
        color: "",
        stock: 0
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add material",
        variant: "destructive",
      });
    },
  });

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Material> }) => {
      const response = await apiRequest("PATCH", `/api/admin/customizations/materials/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customizations', productId] });
      toast({
        title: "Success",
        description: "Material updated successfully",
      });
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

  const handleAddMaterial = () => {
    createMaterialMutation.mutate(newMaterial);
  };

  const handleUpdateStock = (materialId: string, stock: number) => {
    updateMaterialMutation.mutate({ 
      id: materialId, 
      data: { stock: stock } as any
    });
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
            onClick={() => {
              setNewMaterial({ ...newMaterial, subType, type: subType.includes('wood') ? 'wood' : subType.includes('upholstery') ? 'fabric' : 'hardware' });
              setShowAddMaterial(true);
            }}
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
                {renderMaterialSection("hardware", "Hardware Options", Wrench)}
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

      {/* Add Material Dialog */}
      <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Material</DialogTitle>
            <DialogDescription>
              Add a new customization option for this product
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                placeholder="e.g., Natural Teak, Matte Black"
                data-testid="input-material-name"
              />
            </div>

            <div>
              <Label htmlFor="priceModifier">Price Modifier</Label>
              <Input
                id="priceModifier"
                value={newMaterial.priceModifier}
                onChange={(e) => setNewMaterial({ ...newMaterial, priceModifier: e.target.value })}
                placeholder="e.g., 150 or 15%"
                data-testid="input-price-modifier"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter flat amount (150) or percentage (15%)</p>
            </div>

            {newMaterial.subType === 'wood-stain' && (
              <div>
                <Label htmlFor="color">Color (for swatches)</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={newMaterial.color || '#000000'}
                    onChange={(e) => setNewMaterial({ ...newMaterial, color: e.target.value })}
                    className="w-20"
                    data-testid="input-color"
                  />
                  <Input
                    value={newMaterial.color || ''}
                    onChange={(e) => setNewMaterial({ ...newMaterial, color: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="stock">Initial Stock</Label>
              <Input
                id="stock"
                type="number"
                value={newMaterial.stock}
                onChange={(e) => setNewMaterial({ ...newMaterial, stock: parseInt(e.target.value) || 0 })}
                placeholder="0"
                data-testid="input-stock"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={newMaterial.description || ''}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                placeholder="Additional details"
                data-testid="input-description"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAddMaterial(false)}
              data-testid="button-cancel-add"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMaterial}
              disabled={!newMaterial.name || createMaterialMutation.isPending}
              data-testid="button-save-material"
            >
              <Save className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
