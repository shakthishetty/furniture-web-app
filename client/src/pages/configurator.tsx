import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, RotateCcw, Share2, ShoppingCart, Star, Info } from "lucide-react";
import * as THREE from 'three';
import { loadFurnitureModel, updateFurnitureMaterial, updateFurnitureDimensions, createFallbackModel } from "@/utils/3d-models";
import { useCart } from "@/hooks/useCart";

interface Configuration {
  material?: string;
  color?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  hardware?: string;
  finish?: string;
}

export default function Configurator() {
  const params = useParams();
  const productId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { addToCart } = useCart();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const furnitureRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number>();

  const [configuration, setConfiguration] = useState<Configuration>({});
  const [configurationName, setConfigurationName] = useState("");
  const [savedConfigurationId, setSavedConfigurationId] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [productImages, setProductImages] = useState<string[]>([]);

  // Fetch product details
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: [`/api/configurator/products/${productId}`],
    enabled: !!productId,
  });

  // Fetch configuration options
  const { data: optionsData, isLoading: optionsLoading } = useQuery({
    queryKey: [`/api/configurator/products/${productId}/options`],
    enabled: !!productId,
  });

  // Fetch materials
  const { data: materialsData } = useQuery({
    queryKey: ['/api/configurator/materials'],
    queryFn: async () => {
      const response = await fetch('/api/configurator/materials');
      return await response.json();
    },
  });

  // Fetch pricing
  const { data: pricingData, refetch: refetchPricing } = useQuery({
    queryKey: [`/api/configurator/pricing`, configuration],
    queryFn: async () => {
      if (!productId || Object.keys(configuration).length === 0) return null;
      const response = await apiRequest('POST', '/api/configurator/pricing', {
        productId,
        configuration,
      });
      return await response.json();
    },
    enabled: !!productId && Object.keys(configuration).length > 0,
  });

  const product = (productData as any)?.product;
  const options = (optionsData as any)?.options || [];
  const materials = (materialsData as any)?.materials || [];

  // Parse product images when product is loaded
  useEffect(() => {
    if (product) {
      const images: string[] = [];
      
      // Add main image if it exists
      if (product.imageUrl) {
        images.push(product.imageUrl);
      }
      
      // Add additional images if they exist
      if (product.additionalImages) {
        try {
          const additionalImages = JSON.parse(product.additionalImages);
          if (Array.isArray(additionalImages)) {
            images.push(...additionalImages);
          }
        } catch (error) {
          console.error('Error parsing additional images:', error);
        }
      }
      
      setProductImages(images);
      // Set default to 360° view (last thumbnail)
      setSelectedThumbnail(images.length);
    }
  }, [product]);

  // Save configuration mutation
  const saveConfigurationMutation = useMutation({
    mutationFn: async (data: { name?: string; configuration: Configuration }) => {
      const response = await apiRequest('POST', '/api/configurator/configurations', {
        productId,
        name: data.name,
        configuration: data.configuration,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setSavedConfigurationId(data.configuration.id);
      toast({
        title: 'Configuration saved',
        description: 'Your custom configuration has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/configurator/configurations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save configuration.',
        variant: 'destructive',
      });
    },
  });

  // Initialize 3D scene
  useEffect(() => {
    if (productLoading || optionsLoading) return;
    const canvas = canvasRef.current;
    if (!canvas || sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, 800 / 600, 0.1, 1000);
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      antialias: true,
      alpha: true
    });
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    const resize = () => {
      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 600;
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    window.addEventListener('resize', resize);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xe0e0e0, 0.6);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f5, opacity: 0.5, transparent: true });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1.5;
    plane.receiveShadow = true;
    scene.add(plane);

    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;

    const handleMouseDown = (event: MouseEvent) => { 
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };
    
    const handleMouseUp = () => { 
      isMouseDown = false; 
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !furnitureRef.current) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      furnitureRef.current.rotation.y += deltaX * 0.005;
      
      const newRotationX = furnitureRef.current.rotation.x + deltaY * 0.003;
      furnitureRef.current.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, newRotationX));
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    setSceneReady(true);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [productLoading, optionsLoading]);

  // Add furniture model
  useEffect(() => {
    if (!sceneReady || !sceneRef.current || !product) return;

    const loadModel = async () => {
      if (furnitureRef.current && sceneRef.current) {
        sceneRef.current.remove(furnitureRef.current);
      }

      let furnitureGroup;
      
      if (product.model3dUrl) {
        try {
          furnitureGroup = await loadFurnitureModel(product.model3dUrl);
        } catch (error) {
          furnitureGroup = createFallbackModel();
        }
      } else {
        furnitureGroup = createFallbackModel();
      }

      const box = new THREE.Box3().setFromObject(furnitureGroup);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      
      const targetSize = 2.0;
      const scale = targetSize / maxSize;
      furnitureGroup.scale.setScalar(scale);
      
      furnitureGroup.position.sub(center.multiplyScalar(scale));

      if (sceneRef.current) {
        sceneRef.current.add(furnitureGroup);
        furnitureRef.current = furnitureGroup;
      }
    };

    loadModel();
  }, [sceneReady, product]);

  // Update 3D model based on configuration
  useEffect(() => {
    if (!furnitureRef.current || !product) return;

    if (configuration.dimensions) {
      updateFurnitureDimensions(furnitureRef.current, configuration.dimensions, product.name);
    }

    if (configuration.material) {
      const selectedMaterial = materials.find((m: any) => m.id === configuration.material);
      if (selectedMaterial && selectedMaterial.color) {
        updateFurnitureMaterial(furnitureRef.current, selectedMaterial.color);
      }
    }

    if (configuration.color) {
      updateFurnitureMaterial(furnitureRef.current, configuration.color);
    }
  }, [configuration, materials, product]);

  // Resize canvas when switching to 360° view
  useEffect(() => {
    if (selectedThumbnail === productImages.length && canvasRef.current && rendererRef.current && cameraRef.current) {
      // Trigger resize after a short delay to ensure canvas is visible
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const width = canvas.clientWidth || 800;
        const height = canvas.clientHeight || 600;
        
        if (rendererRef.current && cameraRef.current) {
          rendererRef.current.setPixelRatio(window.devicePixelRatio);
          rendererRef.current.setSize(width, height, false);
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }
      }, 50);
    }
  }, [selectedThumbnail, productImages.length]);

  const updateConfiguration = (key: keyof Configuration, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      [key]: value
    }));
    refetchPricing();
  };

  const resetConfiguration = () => {
    setConfiguration({});
    setSavedConfigurationId(null);
  };

  const saveConfiguration = () => {
    const name = configurationName || `${product?.name} Custom Configuration`;
    saveConfigurationMutation.mutate({ name, configuration });
  };

  const addToCartWithConfiguration = () => {
    if (!product || !pricingData) return;
    
    addToCart({
      productId: product.id,
      configurationId: savedConfigurationId || undefined,
      customConfiguration: configuration,
      name: `${product.name} (Custom)`,
      price: parseFloat(pricingData.totalPrice),
      imageUrl: product.imageUrl,
    });
    
    toast({
      title: "Added to cart!",
      description: `${product.name} with custom configuration has been added to your cart.`,
    });
    
    setLocation('/cart');
  };

  if (productLoading || optionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#254127] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading configurator...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Link href="/catalog">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/catalog">
            <Button variant="ghost" size="sm" data-testid="back-to-catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - 3D Preview & Thumbnails */}
          <div className="flex gap-4">
            {/* Vertical Thumbnail List */}
            <div className="flex flex-col gap-3 w-20">
              {/* Product Images */}
              {productImages.map((imageUrl, index) => (
                <div
                  key={`img-${index}`}
                  className={`bg-gray-100 rounded-lg p-2 cursor-pointer border-2 transition-all ${
                    selectedThumbnail === index
                      ? 'border-[#254127]'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedThumbnail(index)}
                  data-testid={`thumbnail-${index}`}
                >
                  <div className="aspect-square bg-gray-200 rounded overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
              
              {/* 360° 3D View Thumbnail */}
              <div
                className={`bg-gray-100 rounded-lg p-2 cursor-pointer border-2 transition-all ${
                  selectedThumbnail === productImages.length
                    ? 'border-[#254127]'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => setSelectedThumbnail(productImages.length)}
                data-testid="thumbnail-360"
              >
                <div className="aspect-square bg-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-700">360°</div>
                    <div className="text-[8px] text-gray-500 mt-1">3D View</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Preview */}
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg overflow-hidden border mb-3 relative">
                {/* Show 3D Canvas when 360° view is selected */}
                <canvas
                  ref={canvasRef}
                  className={`w-full h-[600px] cursor-move ${
                    selectedThumbnail === productImages.length ? 'block' : 'hidden'
                  }`}
                  data-testid="3d-preview"
                />
                
                {/* Show selected product image when image thumbnail is selected */}
                {selectedThumbnail < productImages.length && (
                  <div className="w-full h-[600px] flex items-center justify-center bg-white">
                    <img 
                      src={productImages[selectedThumbnail]} 
                      alt={product.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 text-center">
                {selectedThumbnail === productImages.length 
                  ? 'Click and drag to rotate • Changes update in real-time'
                  : `Viewing image ${selectedThumbnail + 1} of ${productImages.length}`
                }
              </div>
            </div>
          </div>

          {/* Right Side - Product Details & Options */}
          <div className="space-y-6">
            {/* Product Title & Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(5 reviews)</span>
              </div>
              
              <div className="flex items-baseline gap-3 mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  ${pricingData ? parseFloat(pricingData.totalPrice).toLocaleString() : product.basePrice?.toLocaleString() || '0'}
                </div>
                {pricingData && (
                  <div className="text-sm text-gray-500">
                    (customized price)
                  </div>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed">
                {product.description || "Customize this beautiful piece of furniture to match your exact specifications. Choose from various materials, dimensions, and finishes."}
              </p>
            </div>

            <Separator />

            {/* Material & Finish Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Choose Material</Label>
                <div className="flex flex-wrap gap-4">
                  {materials.filter((m: any) => m.type === 'wood').map((material: any) => (
                    <div
                      key={material.id}
                      className="flex flex-col items-center cursor-pointer"
                      onClick={() => updateConfiguration('material', material.id)}
                      data-testid={`material-${material.id}`}
                    >
                      <div
                        className={`w-24 h-24 rounded border-2 transition-all relative ${
                          configuration.material === material.id
                            ? 'border-[#254127] border-4'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: material.color || '#8B4513' }}
                      >
                        {configuration.material === material.id && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#254127]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-sm font-medium text-gray-900">{material.name}</div>
                        {material.priceMultiplier !== '1.0' && (
                          <div className="text-xs text-gray-500">
                            +{((parseFloat(material.priceMultiplier) - 1) * 100).toFixed(0)}% price
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Custom Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={configuration.color || '#8B4513'}
                    onChange={(e) => updateConfiguration('color', e.target.value)}
                    className="w-20 h-12 cursor-pointer"
                    data-testid="color-picker"
                  />
                  <div className="text-sm text-gray-600">
                    Or choose a custom color for your furniture
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dimensions Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold mb-3 block">Adjust Dimensions</Label>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-gray-700">Width</Label>
                    <span className="text-sm font-medium">{configuration.dimensions?.width || 24}"</span>
                  </div>
                  <Slider
                    value={[configuration.dimensions?.width || 24]}
                    onValueChange={([value]) => updateConfiguration('dimensions', {
                      ...configuration.dimensions,
                      width: value
                    })}
                    min={12}
                    max={72}
                    step={1}
                    className="mt-2"
                    data-testid="width-slider"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-gray-700">Height</Label>
                    <span className="text-sm font-medium">{configuration.dimensions?.height || 30}"</span>
                  </div>
                  <Slider
                    value={[configuration.dimensions?.height || 30]}
                    onValueChange={([value]) => updateConfiguration('dimensions', {
                      ...configuration.dimensions,
                      height: value
                    })}
                    min={12}
                    max={48}
                    step={1}
                    className="mt-2"
                    data-testid="height-slider"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-gray-700">Depth</Label>
                    <span className="text-sm font-medium">{configuration.dimensions?.depth || 18}"</span>
                  </div>
                  <Slider
                    value={[configuration.dimensions?.depth || 18]}
                    onValueChange={([value]) => updateConfiguration('dimensions', {
                      ...configuration.dimensions,
                      depth: value
                    })}
                    min={8}
                    max={36}
                    step={1}
                    className="mt-2"
                    data-testid="depth-slider"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Hardware & Finish Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Hardware Finish</Label>
                <Select
                  value={configuration.hardware || ''}
                  onValueChange={(value) => updateConfiguration('hardware', value)}
                >
                  <SelectTrigger data-testid="hardware-select" className="w-full">
                    <SelectValue placeholder="Choose hardware finish" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brass">Brass</SelectItem>
                    <SelectItem value="chrome">Chrome</SelectItem>
                    <SelectItem value="black">Matte Black</SelectItem>
                    <SelectItem value="nickel">Brushed Nickel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Surface Finish</Label>
                <Select
                  value={configuration.finish || ''}
                  onValueChange={(value) => updateConfiguration('finish', value)}
                >
                  <SelectTrigger data-testid="finish-select" className="w-full">
                    <SelectValue placeholder="Choose surface finish" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural Oil</SelectItem>
                    <SelectItem value="satin">Satin Lacquer</SelectItem>
                    <SelectItem value="gloss">High Gloss</SelectItem>
                    <SelectItem value="matte">Matte Finish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Pricing Breakdown */}
            {pricingData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-semibold mb-3">Price Breakdown</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span>${pricingData.breakdown.basePrice.toLocaleString()}</span>
                  </div>
                  {pricingData.breakdown.adjustments.map((adj: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{adj.name}:</span>
                      <span>{adj.amount >= 0 ? '+' : ''}${adj.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {pricingData.breakdown.materialCosts.map((cost: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{cost.name} (×{cost.multiplier}):</span>
                      <span>+${cost.cost.toLocaleString()}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span className="text-[#254127]">${parseFloat(pricingData.totalPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {!savedConfigurationId ? (
                <>
                  <Button
                    onClick={saveConfiguration}
                    disabled={saveConfigurationMutation.isPending}
                    className="w-full bg-[#254127] hover:bg-[#1a2f1b] h-12 text-base"
                    data-testid="save-configuration"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {saveConfigurationMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </Button>
                  <p className="text-sm text-gray-600 text-center">
                    Save your configuration to add it to cart
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-sm text-green-800">
                    ✅ Configuration saved successfully!
                  </div>
                  <Button
                    onClick={addToCartWithConfiguration}
                    className="w-full bg-[#254127] hover:bg-[#1a2f1b] h-14 text-lg"
                    data-testid="add-to-cart"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                </>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetConfiguration}
                  className="flex-1"
                  data-testid="reset-config"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  data-testid="share-config"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Free shipping on orders over $500</p>
                  <p className="text-blue-800">Handcrafted to order. Delivery in 4-6 weeks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
