import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, RotateCcw, Heart, MapPin, Check } from "lucide-react";
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

  const [configuration, setConfiguration] = useState<Configuration>({
    dimensions: { width: 24, height: 30, depth: 18 }
  });
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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
  const materials = (materialsData as any)?.materials || [];

  // Initialize 3D scene
  useEffect(() => {
    if (productLoading || optionsLoading) return;
    const canvas = canvasRef.current;
    if (!canvas || sceneRef.current) return;

    try {
      const scene = new THREE.Scene();
      scene.background = null;
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      camera.position.set(3, 2, 3);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true,
        alpha: true,
        failIfMajorPerformanceCaveat: false
      });
      
      const gl = renderer.getContext();
      if (!gl) {
        throw new Error('WebGL not supported');
      }
      
      renderer.setClearAlpha(0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      const resize = () => {
        const width = canvas.clientWidth || 600;
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
      const handleMouseUp = () => { isMouseDown = false; };
      const handleMouseMove = (event: MouseEvent) => {
        if (!isMouseDown) return;
        
        const deltaX = event.clientX - mouseX;
        
        if (furnitureRef.current) {
          furnitureRef.current.rotation.y += deltaX * 0.01;
        }
        
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
    } catch (error) {
      console.error('WebGL initialization error:', error);
      setWebglError(true);
    }
  }, [productLoading, optionsLoading]);

  // Load furniture model
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
          console.error('Failed to load GLB model, using fallback model:', error);
          furnitureGroup = createFallbackModel();
        }
      } else {
        furnitureGroup = createFallbackModel();
      }

      const box = new THREE.Box3().setFromObject(furnitureGroup);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      
      const targetSize = 2.5;
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

  const updateConfiguration = (key: keyof Configuration, value: any) => {
    setConfiguration(prev => ({
      ...prev,
      [key]: value
    }));
    refetchPricing();
  };

  const addToCartWithConfiguration = () => {
    if (!product) return;
    
    const price = pricingData ? parseFloat(pricingData.totalPrice) : parseFloat(product.price);
    
    addToCart({
      productId: product.id,
      customConfiguration: configuration,
      name: `${product.name} (Custom)`,
      price: price,
      imageUrl: product.imageUrl,
    });
    
    toast({
      title: "Added to cart!",
      description: `${product.name} with custom configuration has been added to your cart.`,
    });
    
    setLocation('/cart');
  };

  // Thumbnail images (different rotation angles)
  const thumbnailRotations = [
    { angle: 0, label: 'Front' },
    { angle: Math.PI / 2, label: 'Right' },
    { angle: Math.PI, label: 'Back' },
    { angle: -Math.PI / 2, label: 'Left' },
  ];

  const setViewAngle = (angle: number, index: number) => {
    if (furnitureRef.current) {
      furnitureRef.current.rotation.y = angle;
    }
    setSelectedThumbnail(index);
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

  const basePrice = pricingData ? parseFloat(pricingData.totalPrice) : (product.price ? parseFloat(product.price) : 0);

  const configurationSteps = [
    { id: 'material', title: 'Material & Finish' },
    { id: 'dimensions', title: 'Dimensions' },
    { id: 'hardware', title: 'Hardware' },
    { id: 'review', title: 'Review & Save' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b px-4 md:px-8 py-4">
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side - 3D Viewer with Thumbnails */}
          <div className="lg:col-span-7">
            <div className="flex gap-4">
              {/* Thumbnail Column */}
              <div className="flex flex-col gap-3 w-20">
                {/* Main Product Thumbnail */}
                <div
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedThumbnail === 0 ? 'border-gray-900 ring-2 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => setViewAngle(0, 0)}
                  data-testid="thumbnail-0"
                >
                  <img
                    src={product.imageUrl || '/placeholder-furniture.jpg'}
                    alt="Front view"
                    className="w-full h-20 object-cover"
                  />
                </div>

                {/* 360° Rotation Button */}
                <div
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all flex items-center justify-center ${
                    selectedThumbnail === -1 ? 'border-gray-900 ring-2 ring-gray-900 bg-gray-100' : 'border-gray-200 hover:border-gray-400 bg-white'
                  }`}
                  onClick={() => {
                    setSelectedThumbnail(-1);
                    setIsRotating(!isRotating);
                  }}
                  data-testid="rotate-360"
                >
                  <div className="p-2 text-center">
                    <RotateCcw className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-[10px] font-medium">360°</div>
                  </div>
                </div>

                {/* Additional View Thumbnails */}
                {thumbnailRotations.slice(1).map((rotation, idx) => (
                  <div
                    key={idx + 1}
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all flex items-center justify-center bg-gray-50 ${
                      selectedThumbnail === idx + 1 ? 'border-gray-900 ring-2 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                    onClick={() => setViewAngle(rotation.angle, idx + 1)}
                    data-testid={`thumbnail-${idx + 1}`}
                  >
                    <img
                      src={product.imageUrl || '/placeholder-furniture.jpg'}
                      alt={rotation.label}
                      className="w-full h-20 object-cover"
                    />
                  </div>
                ))}

                {/* Dimension View */}
                <div
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all flex items-center justify-center bg-white ${
                    selectedThumbnail === 5 ? 'border-gray-900 ring-2 ring-gray-900' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedThumbnail(5)}
                  data-testid="thumbnail-dimension"
                >
                  <div className="p-2 text-center">
                    <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" strokeWidth="2" />
                      <path d="M3 9h18M9 3v18" strokeWidth="2" />
                    </svg>
                    <div className="text-[10px] font-medium mt-1">Size</div>
                  </div>
                </div>
              </div>

              {/* Main 3D Viewer */}
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg overflow-hidden relative">
                  {webglError ? (
                    <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
                      <div className="text-center p-8">
                        <img
                          src={product.imageUrl || '/placeholder-furniture.jpg'}
                          alt={product.name}
                          className="w-full h-auto max-w-md mx-auto mb-4 rounded-lg"
                        />
                        <p className="text-gray-600 text-sm">3D preview not available</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <canvas
                        ref={canvasRef}
                        className="w-full aspect-square cursor-move"
                        data-testid="3d-preview"
                      />
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow">
                        Click and drag to rotate
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Product Info & Configuration */}
          <div className="lg:col-span-5">
            <div className="space-y-6">
              {/* Product Header */}
              <div>
                <h1 className="text-3xl font-normal mb-2" data-testid="product-name">{product.name}</h1>
                <div className="text-sm text-gray-600 mb-3">
                  Shop {product.manufacturer || 'Teak Theory'}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-normal" data-testid="product-price">
                    ${basePrice.toFixed(2)}
                  </div>
                  <Button variant="ghost" size="icon" data-testid="wishlist-button">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex items-center text-sm mb-4">
                  <div className="flex items-center mr-4">
                    <span className="text-yellow-500">★★★★★</span>
                    <span className="ml-2 underline">3 Reviews</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  SKU: {product.sku || 'E82427'}
                </div>
              </div>

              {/* Step Navigation */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-6">
                  {configurationSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <button
                        onClick={() => setCurrentStep(index)}
                        className={`flex items-center space-x-2 ${
                          index === currentStep ? 'text-[#254127]' : 'text-gray-400'
                        }`}
                        data-testid={`step-${step.id}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === currentStep ? 'bg-[#254127] text-white' : 'bg-gray-200'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="hidden md:inline text-sm font-medium">{step.title}</span>
                      </button>
                      {index < configurationSteps.length - 1 && (
                        <div className={`w-8 h-0.5 mx-2 ${
                          index < currentStep ? 'bg-[#254127]' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Content */}
                <div className="space-y-6">
                  {/* Step 0: Material & Finish */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold mb-6">Material & Finish</h3>
                      
                      {/* Fabric Selection */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm text-gray-600 mb-1">2. Fabric</div>
                            <div className="font-medium">
                              {configuration.material 
                                ? materials.find((m: any) => m.id === configuration.material)?.name || 'Select Fabric'
                                : 'Select Fabric'}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{materials.length} options</span>
                        </div>

                        {/* Fabric Details */}
                        {configuration.material && (
                          <div className="mb-4 pb-4 border-b">
                            <div className="font-medium mb-1">
                              {materials.find((m: any) => m.id === configuration.material)?.name}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {materials.find((m: any) => m.id === configuration.material)?.description || 'Cotton Blend Velvet'}
                            </div>
                            <div className="text-lg font-semibold mb-2">
                              ${basePrice.toFixed(2)}
                            </div>
                            <button className="text-sm underline text-gray-600 hover:text-gray-900">
                              Care & Material Details
                            </button>
                          </div>
                        )}

                        {/* Stocked Colors */}
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-3">Stocked: Fastest delivery</div>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { name: 'Turmeric', color: '#C17D3A', hex: '#C17D3A', fabric: 'Luca, Velvet' },
                              { name: 'Snow', color: '#F5F5F5', hex: '#F5F5F5', fabric: 'Robusta, Chenille' },
                              { name: 'Forest Green', color: '#2D4A2B', hex: '#2D4A2B', fabric: 'Logan, Velvet' },
                            ].map((colorOption) => (
                              <div key={colorOption.name} className="text-center">
                                <div
                                  className={`w-full aspect-square rounded-md border-2 cursor-pointer transition-all relative ${
                                    configuration.color === colorOption.hex
                                      ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  style={{ backgroundColor: colorOption.color }}
                                  onClick={() => updateConfiguration('color', colorOption.hex)}
                                  data-testid={`color-${colorOption.name.toLowerCase().replace(' ', '-')}`}
                                >
                                  {configuration.color === colorOption.hex && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                        <Check className="h-5 w-5 text-gray-900" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm font-medium mt-2">{colorOption.name}</div>
                                <div className="text-xs text-gray-600">{colorOption.fabric}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Material Options */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="text-sm font-medium mb-3">All Materials</div>
                          <div className="grid grid-cols-2 gap-3">
                            {materials.slice(0, 4).map((material: any) => (
                              <button
                                key={material.id}
                                className={`border-2 rounded-lg p-3 text-left transition-all ${
                                  configuration.material === material.id
                                    ? 'border-gray-900 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => updateConfiguration('material', material.id)}
                                data-testid={`material-${material.id}`}
                              >
                                <div
                                  className="w-full h-16 rounded mb-2"
                                  style={{ backgroundColor: material.color || '#8B4513' }}
                                />
                                <div className="text-sm font-medium">{material.name}</div>
                                {material.priceMultiplier !== '1.0' && (
                                  <div className="text-xs text-gray-600">
                                    +{((parseFloat(material.priceMultiplier) - 1) * 100).toFixed(0)}% price
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Dimensions */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold mb-6">Dimensions</h3>
                      
                      {/* Visual Dimension Preview */}
                      <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="relative w-full h-64 flex items-center justify-center">
                          <div className="relative">
                            {/* Simple chair illustration */}
                            <div className="w-40 h-40 bg-gray-300 rounded-lg relative">
                              {/* Width dimension line */}
                              <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
                                <div className="flex items-center text-xs">
                                  <div className="h-px w-2 bg-gray-600"></div>
                                  <span className="mx-2 font-medium">{configuration.dimensions?.width || 24}"</span>
                                  <div className="h-px w-2 bg-gray-600"></div>
                                </div>
                              </div>
                              {/* Height dimension line */}
                              <div className="absolute -right-12 top-0 bottom-0 flex flex-col items-center justify-center">
                                <div className="flex flex-col items-center text-xs">
                                  <div className="w-px h-2 bg-gray-600"></div>
                                  <span className="my-2 font-medium">{configuration.dimensions?.height || 30}"</span>
                                  <div className="w-px h-2 bg-gray-600"></div>
                                </div>
                              </div>
                              {/* Depth dimension line */}
                              <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center">
                                <div className="flex items-center text-xs">
                                  <div className="h-px w-2 bg-gray-600"></div>
                                  <span className="mx-2 font-medium">{configuration.dimensions?.depth || 18}"</span>
                                  <div className="h-px w-2 bg-gray-600"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Overall Dimensions */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-base mb-4 uppercase tracking-wide">Overall Dimensions</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Width:</span>
                              <span className="text-sm font-semibold">{configuration.dimensions?.width || 24}"</span>
                            </div>
                            <Slider
                              value={[configuration.dimensions?.width || 24]}
                              onValueChange={([value]) => updateConfiguration('dimensions', {
                                ...configuration.dimensions,
                                width: value
                              })}
                              min={12}
                              max={72}
                              step={0.25}
                              className="mb-1"
                              data-testid="width-slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>12"</span>
                              <span>72"</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Depth:</span>
                              <span className="text-sm font-semibold">{configuration.dimensions?.depth || 18}"</span>
                            </div>
                            <Slider
                              value={[configuration.dimensions?.depth || 18]}
                              onValueChange={([value]) => updateConfiguration('dimensions', {
                                ...configuration.dimensions,
                                depth: value
                              })}
                              min={8}
                              max={36}
                              step={0.25}
                              className="mb-1"
                              data-testid="depth-slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>8"</span>
                              <span>36"</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Height:</span>
                              <span className="text-sm font-semibold">{configuration.dimensions?.height || 30}"</span>
                            </div>
                            <Slider
                              value={[configuration.dimensions?.height || 30]}
                              onValueChange={([value]) => updateConfiguration('dimensions', {
                                ...configuration.dimensions,
                                height: value
                              })}
                              min={12}
                              max={48}
                              step={0.25}
                              className="mb-1"
                              data-testid="height-slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>12"</span>
                              <span>48"</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <button className="text-sm underline text-gray-600 hover:text-gray-900">
                          HOW TO MEASURE FOR FURNITURE DELIVERY
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Hardware */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Hardware</h3>
                        <div className="space-y-4">
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
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review & Save */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Review & Save</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          {configuration.material && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Material:</span>
                              <span className="font-medium">
                                {materials.find((m: any) => m.id === configuration.material)?.name}
                              </span>
                            </div>
                          )}
                          {configuration.color && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Color:</span>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded border" style={{ backgroundColor: configuration.color }} />
                                <span className="font-medium">{configuration.color}</span>
                              </div>
                            </div>
                          )}
                          {configuration.dimensions && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dimensions:</span>
                              <span className="font-medium">
                                {configuration.dimensions.width}" × {configuration.dimensions.height}" × {configuration.dimensions.depth}"
                              </span>
                            </div>
                          )}
                          {configuration.hardware && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hardware:</span>
                              <span className="font-medium capitalize">{configuration.hardware}</span>
                            </div>
                          )}
                          {configuration.finish && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Finish:</span>
                              <span className="font-medium">{configuration.finish}</span>
                            </div>
                          )}
                          <div className="border-t pt-3 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold">Total Price:</span>
                              <span className="text-2xl font-bold text-[#254127]">${basePrice.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                      data-testid="prev-step"
                    >
                      Previous
                    </Button>
                    {currentStep < configurationSteps.length - 1 ? (
                      <Button
                        onClick={() => setCurrentStep(Math.min(configurationSteps.length - 1, currentStep + 1))}
                        className="bg-[#254127] hover:bg-[#1a2f1b]"
                        data-testid="next-step"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        onClick={addToCartWithConfiguration}
                        className="bg-[#254127] hover:bg-[#1a2f1b]"
                        data-testid="add-to-cart"
                      >
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
