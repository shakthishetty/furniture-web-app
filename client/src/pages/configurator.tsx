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

  const [configuration, setConfiguration] = useState<Configuration>({});
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [webglError, setWebglError] = useState(false);

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

  const basePrice = pricingData ? parseFloat(pricingData.totalPrice) : parseFloat(product.price);

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

              {/* Configuration Options */}
              <div className="border-t pt-6 space-y-6">
                {/* Material Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">1. Type</Label>
                    <span className="text-sm text-gray-500">2 options</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={!configuration.material ? "default" : "outline"}
                      className={`h-12 justify-start ${!configuration.material ? 'bg-gray-900 text-white' : ''}`}
                      onClick={() => updateConfiguration('material', undefined)}
                      data-testid="type-standard"
                    >
                      Standard Chair
                    </Button>
                    <Button
                      variant={configuration.material ? "default" : "outline"}
                      className={`h-12 justify-start ${configuration.material ? 'bg-gray-900 text-white' : ''}`}
                      onClick={() => updateConfiguration('material', materials[0]?.id)}
                      data-testid="type-armless"
                    >
                      Armless Chair
                    </Button>
                  </div>
                </div>

                {/* Fabric/Material Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-medium">2. Fabric</Label>
                    <span className="text-sm text-gray-500">{materials.length} options</span>
                  </div>
                  <div className="space-y-3">
                    {materials.slice(0, 2).map((material: any) => (
                      <div
                        key={material.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          configuration.material === material.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        onClick={() => updateConfiguration('material', material.id)}
                        data-testid={`material-${material.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{material.name}</div>
                            {material.priceMultiplier !== '1.0' && (
                              <div className="text-sm text-gray-600">
                                +{((parseFloat(material.priceMultiplier) - 1) * 100).toFixed(0)}% price
                              </div>
                            )}
                          </div>
                          {configuration.material === material.id && (
                            <Check className="h-5 w-5 text-gray-900" />
                          )}
                        </div>
                      </div>
                    ))}
                    <button className="text-sm text-gray-600 underline">
                      Care & Material Details
                    </button>
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <div className="mb-3">
                    <Label className="text-base font-medium">Stocked: Fastest delivery</Label>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { name: 'Turmeric', color: '#C17D3A', hex: '#C17D3A' },
                      { name: 'Snow', color: '#F5F5F5', hex: '#F5F5F5' },
                      { name: 'Forest Green', color: '#2D4A2B', hex: '#2D4A2B' },
                      { name: 'Charcoal', color: '#36454F', hex: '#36454F' },
                    ].map((colorOption) => (
                      <div key={colorOption.name} className="text-center">
                        <div
                          className={`w-16 h-16 rounded border-2 cursor-pointer transition-all ${
                            configuration.color === colorOption.hex
                              ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                              : 'border-gray-300 hover:border-gray-500'
                          } ${colorOption.name === 'Turmeric' ? 'relative' : ''}`}
                          style={{ backgroundColor: colorOption.color }}
                          onClick={() => updateConfiguration('color', colorOption.hex)}
                          data-testid={`color-${colorOption.name.toLowerCase().replace(' ', '-')}`}
                        >
                          {configuration.color === colorOption.hex && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs mt-2">{colorOption.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dimensions Adjustment */}
                {configuration.dimensions && (
                  <div>
                    <Label className="text-base font-medium mb-4 block">Dimensions</Label>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Width</span>
                          <span className="font-medium">{configuration.dimensions.width || 24}"</span>
                        </div>
                        <Slider
                          value={[configuration.dimensions.width || 24]}
                          onValueChange={([value]) => updateConfiguration('dimensions', {
                            ...configuration.dimensions,
                            width: value
                          })}
                          min={12}
                          max={72}
                          step={1}
                          data-testid="width-slider"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Add to Cart */}
                <div className="border-t pt-6">
                  <Button
                    onClick={addToCartWithConfiguration}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white h-14 text-lg"
                    size="lg"
                    data-testid="add-to-cart"
                  >
                    Add to Cart
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Free shipping on orders over $50
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
