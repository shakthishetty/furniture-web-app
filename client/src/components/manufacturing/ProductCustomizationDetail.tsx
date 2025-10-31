import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Calendar, Maximize2, Box } from "lucide-react";
import { Model3DViewer } from "@/components/Model3DViewer";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  customConfiguration: any;
}

interface ProductCustomizationDetailProps {
  item: OrderItem;
  updatedAt?: Date;
}

interface MaterialDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  subType: string | null;
  color: string | null;
  textureUrl: string | null;
}

export function ProductCustomizationDetail({ item, updatedAt }: ProductCustomizationDetailProps) {
  const [config, setConfig] = useState<any>({});
  const [materials, setMaterials] = useState<MaterialDetail[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [productModelUrl, setProductModelUrl] = useState<string | null>(null);

  // Parse configuration
  useEffect(() => {
    try {
      const parsedConfig = typeof item.customConfiguration === 'string' 
        ? JSON.parse(item.customConfiguration) 
        : item.customConfiguration;
      setConfig(parsedConfig || {});
    } catch (error) {
      console.error("Failed to parse customConfiguration:", error);
      setConfig({});
    }
  }, [item.customConfiguration]);

  // Fetch product details including 3D model URL with proper error handling
  useEffect(() => {
    fetch(`/api/configurator/products/${item.productId}`)
      .then(res => {
        if (!res.ok) {
          console.warn(`Failed to fetch product details for ${item.productId}`);
          return null;
        }
        return res.json();
      })
      .then(product => {
        // Only set if model URL exists, otherwise leave as null to trigger fallback
        if (product?.model3dUrl) {
          setProductModelUrl(product.model3dUrl);
        } else {
          setProductModelUrl(null); // Explicitly set null to trigger fallback
        }
      })
      .catch((error) => {
        console.error(`Error fetching product details for ${item.productId}:`, error);
        setProductModelUrl(null); // Ensure fallback on error
      });
  }, [item.productId]);

  // Fetch material details for all selected materials
  useEffect(() => {
    const materialIds = [
      config.woodType,
      config.woodStain,
      config.upholstery,
      config.hardwareFinish,
      config.surfaceFinish
    ].filter(Boolean);

    if (materialIds.length === 0) {
      setMaterials([]);
      return;
    }

    setLoadingMaterials(true);
    Promise.all(
      materialIds.map(id => 
        fetch(`/api/configurator/materials/${id}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      )
    ).then(results => {
      setMaterials(results.filter(Boolean));
      setLoadingMaterials(false);
    });
  }, [config]);

  // Helper to get material by ID
  const getMaterial = (materialId: string | undefined) => {
    if (!materialId) return null;
    return materials.find(m => m.id === materialId);
  };

  const woodType = getMaterial(config.woodType);
  const woodStain = getMaterial(config.woodStain);
  const upholstery = getMaterial(config.upholstery);
  const hardwareFinish = getMaterial(config.hardwareFinish);
  const surfaceFinish = getMaterial(config.surfaceFinish);

  const hasCustomizations = woodType || woodStain || upholstery || hardwareFinish || surfaceFinish || config.dimensions;

  return (
    <Card className="overflow-hidden border-2" data-testid={`customization-detail-${item.id}`}>
      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-background pb-4 border-b">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Product Image */}
          <div className="flex-shrink-0">
            {item.productImage ? (
              <img 
                src={item.productImage} 
                alt={item.productName}
                className="w-28 h-28 object-cover rounded-xl border-2 border-primary/20 shadow-lg ring-2 ring-primary/10"
                data-testid={`img-product-${item.id}`}
              />
            ) : (
              <div className="w-28 h-28 bg-muted/80 rounded-xl border-2 border-primary/20 flex items-center justify-center shadow-md">
                <Package className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-2xl font-bold mb-3 text-foreground" data-testid={`text-product-name-${item.id}`}>
              {item.productName}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-semibold px-3 py-1" data-testid={`badge-quantity-${item.id}`}>
                <Package className="h-3.5 w-3.5 mr-1.5" />
                Quantity: {item.quantity}
              </Badge>
              <Badge variant="default" className="font-mono px-3 py-1 bg-green-600 hover:bg-green-700" data-testid={`badge-price-${item.id}`}>
                ${item.totalPrice}
              </Badge>
              {updatedAt && (
                <Badge variant="secondary" className="text-xs px-2.5 py-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Updated {new Date(updatedAt).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-auto p-1">
            <TabsTrigger value="materials" data-testid={`tab-materials-${item.id}`} className="py-2.5">
              <span className="text-sm font-semibold">Material Details</span>
            </TabsTrigger>
            <TabsTrigger value="preview" data-testid={`tab-preview-${item.id}`} className="py-2.5">
              <span className="text-sm font-semibold">Visual Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-5 mt-2">
            {loadingMaterials ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground">Loading material details...</p>
              </div>
            ) : hasCustomizations ? (
              <>
                {/* Timestamp Header */}
                {updatedAt && (
                  <div className="flex items-center justify-between pb-3 border-b border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Last updated by customer: {new Date(updatedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                )}

                {/* Wood Type Section */}
                {woodType && (
                  <div className="space-y-3" data-testid={`section-wood-type-${item.id}`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <span className="text-xl">🪵</span>
                      <h4>Wood Type</h4>
                    </div>
                    <div className="pl-4 sm:pl-8 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-4 bg-gradient-to-r from-amber-50/50 to-background dark:from-amber-950/10 dark:to-background rounded-xl border border-amber-200/30 dark:border-amber-800/30">
                        <span className="text-sm font-semibold">{woodType.name}</span>
                        {woodType.color && (
                          <div 
                            className="w-10 h-10 rounded-lg border-2 border-border shadow-md ring-2 ring-offset-2 ring-amber-400/20 flex-shrink-0"
                            style={{ backgroundColor: woodType.color }}
                            title={woodType.name}
                          />
                        )}
                      </div>
                      {woodType.description && (
                        <p className="text-xs text-muted-foreground pl-0 sm:pl-4 italic">{woodType.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Wood Stain Section */}
                {woodStain && (
                  <div className="space-y-3" data-testid={`section-wood-stain-${item.id}`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <span className="text-xl">🎨</span>
                      <h4>Wood Stain</h4>
                    </div>
                    <div className="pl-4 sm:pl-8 space-y-2">
                      <div className="flex items-start sm:items-center justify-between py-3 px-4 bg-gradient-to-r from-purple-50/50 to-background dark:from-purple-950/10 dark:to-background rounded-xl border border-purple-200/30 dark:border-purple-800/30">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {woodStain.color && (
                            <div 
                              className="w-12 h-12 rounded-lg border-2 border-border shadow-lg ring-2 ring-offset-2 ring-purple-400/20 flex-shrink-0"
                              style={{ backgroundColor: woodStain.color }}
                              title={woodStain.name}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate">{woodStain.name}</div>
                            {woodStain.color && (
                              <div className="text-xs text-muted-foreground font-mono mt-0.5 break-all">{woodStain.color}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      {woodStain.description && (
                        <p className="text-xs text-muted-foreground pl-0 sm:pl-4 italic">{woodStain.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Upholstery Section */}
                {upholstery && (
                  <div className="space-y-3" data-testid={`section-upholstery-${item.id}`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <span className="text-xl">🧵</span>
                      <h4>Fabric Upholstery</h4>
                    </div>
                    <div className="pl-4 sm:pl-8 space-y-2">
                      <div className="flex items-start sm:items-center justify-between py-3 px-4 bg-gradient-to-r from-blue-50/50 to-background dark:from-blue-950/10 dark:to-background rounded-xl border border-blue-200/30 dark:border-blue-800/30">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {upholstery.color && (
                            <div 
                              className="w-12 h-12 rounded-lg border-2 border-border shadow-lg ring-2 ring-offset-2 ring-blue-400/20 flex-shrink-0"
                              style={{ backgroundColor: upholstery.color }}
                              title={upholstery.name}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate">{upholstery.name}</div>
                            {upholstery.color && (
                              <div className="text-xs text-muted-foreground font-mono mt-0.5 break-all">{upholstery.color}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      {upholstery.description && (
                        <p className="text-xs text-muted-foreground pl-0 sm:pl-4 italic">{upholstery.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Hardware Finish Section */}
                {hardwareFinish && (
                  <div className="space-y-3" data-testid={`section-hardware-${item.id}`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <span className="text-xl">⚙️</span>
                      <h4 className="text-sm sm:text-base">Hardware Finish (Metal Type + Finish Color)</h4>
                    </div>
                    <div className="pl-4 sm:pl-8 space-y-2">
                      <div className="flex items-start sm:items-center justify-between py-3 px-4 bg-gradient-to-r from-slate-50/50 to-background dark:from-slate-950/10 dark:to-background rounded-xl border border-slate-200/30 dark:border-slate-800/30">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {hardwareFinish.color && (
                            <div 
                              className="w-12 h-12 rounded-lg border-2 border-border shadow-lg ring-2 ring-offset-2 ring-slate-400/20 flex-shrink-0"
                              style={{ backgroundColor: hardwareFinish.color }}
                              title={hardwareFinish.name}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate">{hardwareFinish.name}</div>
                            {hardwareFinish.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">{hardwareFinish.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Surface Finish Section */}
                {surfaceFinish && (
                  <div className="space-y-3" data-testid={`section-surface-finish-${item.id}`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <span className="text-xl">✨</span>
                      <h4 className="text-sm sm:text-base">Surface Finish (Matte / Glossy / Satin)</h4>
                    </div>
                    <div className="pl-4 sm:pl-8 space-y-2">
                      <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-yellow-50/50 to-background dark:from-yellow-950/10 dark:to-background rounded-xl border border-yellow-200/30 dark:border-yellow-800/30">
                        <span className="text-sm font-semibold">{surfaceFinish.name}</span>
                      </div>
                      {surfaceFinish.description && (
                        <p className="text-xs text-muted-foreground pl-0 sm:pl-4 italic">{surfaceFinish.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Dimensions Section */}
                {config.dimensions && (
                  <>
                    <Separator className="my-5" />
                    <div className="space-y-3" data-testid={`section-dimensions-${item.id}`}>
                      <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <span className="text-xl">📏</span>
                        <h4>Dimensions</h4>
                      </div>
                      <div className="pl-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          {config.dimensions.width && (
                            <div className="text-center p-4 bg-gradient-to-br from-indigo-50/70 to-background dark:from-indigo-950/20 dark:to-background rounded-xl border border-indigo-200/40 dark:border-indigo-800/40">
                              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Width</div>
                              <div className="text-base font-bold">{config.dimensions.width}</div>
                            </div>
                          )}
                          {config.dimensions.height && (
                            <div className="text-center p-4 bg-gradient-to-br from-indigo-50/70 to-background dark:from-indigo-950/20 dark:to-background rounded-xl border border-indigo-200/40 dark:border-indigo-800/40">
                              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Height</div>
                              <div className="text-base font-bold">{config.dimensions.height}</div>
                            </div>
                          )}
                          {config.dimensions.depth && (
                            <div className="text-center p-4 bg-gradient-to-br from-indigo-50/70 to-background dark:from-indigo-950/20 dark:to-background rounded-xl border border-indigo-200/40 dark:border-indigo-800/40">
                              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Depth</div>
                              <div className="text-base font-bold">{config.dimensions.depth}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Additional Notes Section */}
                {config.additionalNotes && (
                  <>
                    <Separator className="my-5" />
                    <div className="space-y-3" data-testid={`section-notes-${item.id}`}>
                      <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <span className="text-xl">📝</span>
                        <h4 className="text-sm sm:text-base">Additional Notes / Custom Requests</h4>
                      </div>
                      <div className="pl-4 sm:pl-8">
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-50/30 dark:from-amber-950/30 dark:to-amber-950/10 border-l-4 border-amber-400 dark:border-amber-600 rounded-lg shadow-sm">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words">{config.additionalNotes}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
                  <Package className="h-10 w-10 opacity-30" />
                </div>
                <p className="text-sm font-medium">No Customization Details Available</p>
                <p className="text-xs mt-2">This product uses the standard configuration</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="mt-2">
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-base font-bold mb-1.5">
                  {productModelUrl ? '3D Preview' : 'Visual Preview'}
                </h4>
                <p className="text-xs text-muted-foreground mb-6">
                  Configured product as per customer specifications
                </p>
              </div>
              {productModelUrl ? (
                <>
                  <div className="flex justify-center">
                    <Model3DViewer 
                      modelUrl={productModelUrl} 
                      width={600} 
                      height={450}
                      className="w-full max-w-2xl"
                    />
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Interactive 3D Model:</span> Drag to rotate • Scroll to zoom
                    </p>
                  </div>
                </>
              ) : item.productImage ? (
                <>
                  <div className="w-full max-w-2xl mx-auto h-96 rounded-lg overflow-hidden border-2 bg-gradient-to-br from-muted/30 to-muted/10">
                    <div className="relative w-full h-full group">
                      <img 
                        src={item.productImage} 
                        alt={item.productName}
                        className="w-full h-full object-contain p-8 transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <Maximize2 className="h-5 w-5" />
                            <span className="text-sm font-medium">Product Image</span>
                          </div>
                          <p className="text-xs opacity-90">Configured as per customer specifications</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Note:</span> 3D model not available for this product. Showing product image.
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full max-w-2xl mx-auto h-96 flex items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center p-8">
                    <Box className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">Product Preview Unavailable</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">No 3D model or image available for this product</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
