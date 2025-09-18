import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, RotateCcw, Share2, Download, Eye, ShoppingCart, Plus } from "lucide-react";
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

  const [currentStep, setCurrentStep] = useState(0);
  const [configuration, setConfiguration] = useState<Configuration>({});
  const [configurationName, setConfigurationName] = useState("");
  const [savedConfigurationId, setSavedConfigurationId] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

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

  // Initialize 3D scene (run when loading completes and canvas exists)
  useEffect(() => {
    if (productLoading || optionsLoading) return;
    const canvas = canvasRef.current;
    if (!canvas || sceneRef.current) return; // wait for canvas, avoid double init

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      antialias: true 
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Responsive sizing function
    const resize = () => {
      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 600;
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    // Initial sizing
    resize();
    window.addEventListener('resize', resize);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add a ground plane
    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    plane.receiveShadow = true;
    scene.add(plane);

    // Controls (basic rotation)
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;

    const handleMouseDown = () => { isMouseDown = true; };
    const handleMouseUp = () => { isMouseDown = false; };
    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      if (furnitureRef.current) {
        furnitureRef.current.rotation.y += deltaX * 0.01;
        furnitureRef.current.rotation.x += deltaY * 0.01;
      }
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Mark scene as ready
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
  }, [productLoading, optionsLoading]); // Wait for loading to complete

  // Add furniture model when both scene and product are ready
  useEffect(() => {
    if (!sceneReady || !sceneRef.current || !product) return;

    const loadModel = async () => {
      // Remove existing furniture if any
      if (furnitureRef.current && sceneRef.current) {
        sceneRef.current.remove(furnitureRef.current);
      }

      let furnitureGroup;
      
      // Try to load the actual uploaded GLB file first
      if (product.model3dUrl) {
        try {
          console.log('Loading 3D model from:', product.model3dUrl);
          furnitureGroup = await loadFurnitureModel(product.model3dUrl);
        } catch (error) {
          console.error('Failed to load GLB model, using fallback model:', error);
          // Use fallback model if GLB loading fails
          furnitureGroup = createFallbackModel();
        }
      } else {
        // No GLB file, use fallback model
        console.log('No 3D model URL found, using fallback model');
        furnitureGroup = createFallbackModel();
      }

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

    // Update dimensions
    if (configuration.dimensions) {
      updateFurnitureDimensions(furnitureRef.current, configuration.dimensions, product.name);
    }

    // Update material/color
    if (configuration.material) {
      const selectedMaterial = materials.find((m: any) => m.id === configuration.material);
      if (selectedMaterial && selectedMaterial.color) {
        updateFurnitureMaterial(furnitureRef.current, selectedMaterial.color);
      }
    }

    // Update color directly
    if (configuration.color) {
      updateFurnitureMaterial(furnitureRef.current, configuration.color);
    }
  }, [configuration, materials, product]);

  const updateConfiguration = (key: keyof Configuration, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      [key]: value
    }));
    refetchPricing();
  };

  const resetConfiguration = () => {
    setConfiguration({});
    setCurrentStep(0);
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
  };

  const addToCartAndGoToCart = () => {
    addToCartWithConfiguration();
    setLocation('/cart');
  };

  const addToCartAndContinueShopping = () => {
    addToCartWithConfiguration();
    setLocation('/catalog');
  };

  const configurationSteps = [
    { id: 'material', title: 'Material & Finish', icon: '🪵' },
    { id: 'dimensions', title: 'Dimensions', icon: '📏' },
    { id: 'hardware', title: 'Hardware', icon: '🔧' },
    { id: 'review', title: 'Review & Save', icon: '✅' },
  ];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/catalog">
              <Button variant="ghost" size="sm" data-testid="back-to-catalog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Catalog
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-gray-600">Customize your furniture</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {pricingData && (
              <div className="text-right">
                <div className="text-2xl font-bold text-[#254127]">
                  ${parseFloat(pricingData.totalPrice).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">estimated price</div>
              </div>
            )}
            <Button variant="outline" onClick={resetConfiguration} data-testid="reset-config">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveConfiguration} disabled={saveConfigurationMutation.isPending} data-testid="save-config">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-6 py-4 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {configurationSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 cursor-pointer ${
                  index <= currentStep ? 'text-[#254127]' : 'text-gray-400'
                }`}
                onClick={() => setCurrentStep(index)}
                data-testid={`step-${step.id}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep ? 'bg-[#254127] text-white' : 'bg-gray-200'
                }`}>
                  {index + 1}
                </div>
                <span className="hidden md:inline font-medium">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={(currentStep + 1) / configurationSteps.length * 100} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D Preview */}
          <div className="order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>3D Preview</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-96 cursor-move"
                    data-testid="3d-preview"
                  />
                </div>
                <div className="mt-4 text-sm text-gray-600 text-center">
                  Click and drag to rotate • Changes update in real-time
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Panel */}
          <div className="order-1 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle>{configurationSteps[currentStep].title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 0: Material & Finish */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">Choose Material</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {materials.filter((m: any) => m.type === 'wood').map((material: any) => (
                          <div
                            key={material.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              configuration.material === material.id
                                ? 'border-[#254127] bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => updateConfiguration('material', material.id)}
                            data-testid={`material-${material.id}`}
                          >
                            <div
                              className="w-full h-16 rounded mb-2"
                              style={{ backgroundColor: material.color || '#8B4513' }}
                            />
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-gray-600">
                              {material.priceMultiplier !== '1.0' && (
                                <>+{((parseFloat(material.priceMultiplier) - 1) * 100).toFixed(0)}% price</>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-4 block">Custom Color</Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          type="color"
                          value={configuration.color || '#8B4513'}
                          onChange={(e) => updateConfiguration('color', e.target.value)}
                          className="w-20 h-12"
                          data-testid="color-picker"
                        />
                        <div className="text-sm text-gray-600">
                          Or choose a custom color for your furniture
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Dimensions */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">
                        Adjust Dimensions (inches)
                      </Label>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">Width: {configuration.dimensions?.width || 24}"</Label>
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
                          <Label className="text-sm">Height: {configuration.dimensions?.height || 30}"</Label>
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
                          <Label className="text-sm">Depth: {configuration.dimensions?.depth || 18}"</Label>
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
                  </div>
                )}

                {/* Step 2: Hardware */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">Hardware Finish</Label>
                      <Select
                        value={configuration.hardware || ''}
                        onValueChange={(value) => updateConfiguration('hardware', value)}
                      >
                        <SelectTrigger data-testid="hardware-select">
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
                      <Label className="text-base font-medium mb-4 block">Surface Finish</Label>
                      <Select
                        value={configuration.finish || ''}
                        onValueChange={(value) => updateConfiguration('finish', value)}
                      >
                        <SelectTrigger data-testid="finish-select">
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
                )}

                {/* Step 3: Review & Save */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">Configuration Name</Label>
                      <Input
                        value={configurationName}
                        onChange={(e) => setConfigurationName(e.target.value)}
                        placeholder="My Custom Configuration"
                        data-testid="config-name-input"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-4 block">Configuration Summary</Label>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {configuration.material && (
                          <div className="flex justify-between">
                            <span>Material:</span>
                            <span className="font-medium">
                              {materials.find((m: any) => m.id === configuration.material)?.name}
                            </span>
                          </div>
                        )}
                        {configuration.dimensions && (
                          <div className="flex justify-between">
                            <span>Dimensions:</span>
                            <span className="font-medium">
                              {configuration.dimensions.width}" × {configuration.dimensions.height}" × {configuration.dimensions.depth}"
                            </span>
                          </div>
                        )}
                        {configuration.hardware && (
                          <div className="flex justify-between">
                            <span>Hardware:</span>
                            <span className="font-medium capitalize">{configuration.hardware}</span>
                          </div>
                        )}
                        {configuration.finish && (
                          <div className="flex justify-between">
                            <span>Finish:</span>
                            <span className="font-medium">{configuration.finish}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {pricingData && (
                      <div>
                        <Label className="text-base font-medium mb-4 block">Pricing Breakdown</Label>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span>Base Price:</span>
                            <span>${pricingData.breakdown.basePrice.toLocaleString()}</span>
                          </div>
                          {pricingData.breakdown.adjustments.map((adj: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{adj.name}:</span>
                              <span>{adj.amount >= 0 ? '+' : ''}${adj.amount.toLocaleString()}</span>
                            </div>
                          ))}
                          {pricingData.breakdown.materialCosts.map((cost: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{cost.name} (×{cost.multiplier}):</span>
                              <span>+${cost.cost.toLocaleString()}</span>
                            </div>
                          ))}
                          <hr className="my-2" />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-[#254127]">${parseFloat(pricingData.totalPrice).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save Configuration and Add to Cart Section */}
                    {!savedConfigurationId ? (
                      <div className="space-y-4">
                        <Button
                          onClick={saveConfiguration}
                          disabled={saveConfigurationMutation.isPending}
                          className="w-full bg-[#254127] hover:bg-[#1a2f1b]"
                          size="lg"
                          data-testid="save-configuration-final"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saveConfigurationMutation.isPending ? 'Saving Configuration...' : 'Save Configuration'}
                        </Button>
                        <p className="text-sm text-gray-600 text-center">
                          Save your configuration to add it to cart
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <div className="text-green-800 font-medium mb-2">
                            ✅ Configuration saved successfully!
                          </div>
                          <div className="text-sm text-green-700">
                            Your custom configuration is ready to add to cart.
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Button
                            onClick={addToCartAndGoToCart}
                            className="w-full bg-[#254127] hover:bg-[#1a2f1b] text-lg py-3"
                            size="lg"
                            data-testid="add-to-cart-go-to-cart"
                          >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Add to Cart & Review Order
                          </Button>
                          
                          <Button
                            onClick={addToCartAndContinueShopping}
                            variant="outline"
                            className="w-full border-[#254127] text-[#254127] hover:bg-[#254127] hover:text-white text-lg py-3"
                            size="lg"
                            data-testid="add-to-cart-continue-shopping"
                          >
                            <Plus className="h-5 w-5 mr-2" />
                            Add to Cart & Continue Shopping
                          </Button>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSavedConfigurationId(null);
                                setCurrentStep(0);
                              }}
                              className="flex-1"
                            >
                              Start Over
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setSavedConfigurationId(null)}
                              className="flex-1"
                            >
                              Edit Configuration
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    data-testid="prev-step"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(Math.min(configurationSteps.length - 1, currentStep + 1))}
                    disabled={currentStep === configurationSteps.length - 1}
                    className="bg-[#254127] hover:bg-[#1a2f1b]"
                    data-testid="next-step"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}