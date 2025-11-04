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
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RotateCcw, Share2, ShoppingCart, Star, Info } from "lucide-react";
import * as THREE from 'three';
import { loadFurnitureModel, updateFurnitureMaterial, updateFurnitureDimensions, createFallbackModel, storeOriginalColors, applyWoodStain, applyUpholstery, resetWoodToOriginal } from "@/utils/3d-models";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { NestedAssetSelector } from "@/components/NestedAssetSelector";

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
  chairType?: string;
  woodType?: string;
  woodStain?: string;
  upholstery?: string;
}

export default function Configurator() {
  const params = useParams();
  const productId = params.id;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist, isPending: wishlistPending } = useWishlist();
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const furnitureRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number>();
  const cameraRotationRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 4 });
  const cameraDistanceRef = useRef(5);

  const [configuration, setConfiguration] = useState<Configuration>({});
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

  // Fetch product-specific materials (configured by admin)
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: [`/api/configurator/products/${productId}/materials`],
    enabled: !!productId,
  });

  // Fetch pricing
  const { data: pricingData, refetch: refetchPricing } = useQuery({
    queryKey: [`/api/configurator/pricing`, configuration],
    queryFn: async () => {
      if (!productId || Object.keys(configuration).length === 0) return null;
      const response = await fetch('/api/configurator/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          configuration,
        }),
      });
      return await response.json();
    },
    enabled: !!productId && Object.keys(configuration).length > 0,
  });

  const product = (productData as any)?.product;
  const options = (optionsData as any)?.options || [];
  const materials = (materialsData as any)?.materials || {};
  
  // Extract materials by type
  const woodTypes = materials['wood-type'] || [];
  const woodStains = materials['wood-stain'] || [];
  const upholsteryOptions = materials['upholstery'] || [];
  const hardwareOptions = materials['hardware-finish'] || [];
  const surfaceFinishOptions = materials['surface-finish'] || [];

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


  // Initialize 3D scene
  useEffect(() => {
    if (productLoading || optionsLoading) return;
    const canvas = canvasRef.current;
    if (!canvas || sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);
    camera.position.set(4, 2.5, 4);
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xe0e0e0, 0.8);
    hemisphereLight.position.set(0, 5, 0);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

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
      if (!isMouseDown || !cameraRef.current) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      // Orbit camera around model (not rotate model)
      cameraRotationRef.current.theta -= deltaX * 0.01;
      cameraRotationRef.current.phi -= deltaY * 0.01;
      
      // Limit vertical rotation to prevent flipping
      cameraRotationRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraRotationRef.current.phi));
      
      // Update camera position using spherical coordinates
      const distance = cameraDistanceRef.current;
      camera.position.x = distance * Math.sin(cameraRotationRef.current.phi) * Math.cos(cameraRotationRef.current.theta);
      camera.position.y = distance * Math.cos(cameraRotationRef.current.phi);
      camera.position.z = distance * Math.sin(cameraRotationRef.current.phi) * Math.sin(cameraRotationRef.current.theta);
      camera.lookAt(0, 0, 0);
      
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

      // Calculate bounding sphere for proper camera fit
      const box = new THREE.Box3().setFromObject(furnitureGroup);
      const center = box.getCenter(new THREE.Vector3());
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      
      // Center the model at origin
      furnitureGroup.position.sub(center);
      
      // Calculate camera distance from bounding sphere radius
      const fov = cameraRef.current?.fov || 45;
      const fovRad = (fov * Math.PI) / 180;
      const distance = (sphere.radius / Math.sin(fovRad / 2)) * 1.2; // 20% margin
      
      cameraDistanceRef.current = distance;
      
      // Update camera position and clipping planes
      if (cameraRef.current) {
        const camera = cameraRef.current;
        const theta = cameraRotationRef.current.theta;
        const phi = cameraRotationRef.current.phi;
        
        camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
        camera.position.y = distance * Math.cos(phi);
        camera.position.z = distance * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(0, 0, 0);
        
        camera.near = sphere.radius / 50;
        camera.far = sphere.radius * 20;
        camera.updateProjectionMatrix();
      }

      if (sceneRef.current) {
        sceneRef.current.add(furnitureGroup);
        furnitureRef.current = furnitureGroup;
        
        // Store original colors for reset functionality
        storeOriginalColors(furnitureGroup);
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

    if (configuration.material && Object.keys(materials).length > 0) {
      // Flatten grouped materials to find the selected one, filtering out non-array values
      const allMaterials = Object.values(materials)
        .filter((group): group is any[] => Array.isArray(group))
        .flat();
      const selectedMaterial = allMaterials.find((m: any) => m.id === configuration.material);
      if (selectedMaterial && selectedMaterial.color) {
        updateFurnitureMaterial(furnitureRef.current, selectedMaterial.color);
      }
    }

    if (configuration.color) {
      updateFurnitureMaterial(furnitureRef.current, configuration.color);
    }

    // Apply wood stain color to wood parts only (or reset wood to original if "original" is selected)
    if (configuration.woodStain === 'original') {
      // Reset only wood parts to original colors (preserving fabric/upholstery colors)
      resetWoodToOriginal(furnitureRef.current);
    } else if (configuration.woodStain && woodStains.length > 0) {
      const selectedStain = woodStains.find((stain: any) => stain.id === configuration.woodStain);
      if (selectedStain && selectedStain.color) {
        // Apply only to wood materials, not fabric/upholstery
        applyWoodStain(furnitureRef.current, selectedStain.color);
      }
    }

    // Apply upholstery color to fabric/seat/back parts only (not wood)
    if (configuration.upholstery && upholsteryOptions.length > 0) {
      const selectedUpholstery = upholsteryOptions.find((fabric: any) => fabric.id === configuration.upholstery);
      if (selectedUpholstery && selectedUpholstery.color) {
        // Apply only to fabric materials, not wood
        applyUpholstery(furnitureRef.current, selectedUpholstery.color);
      }
    }
  }, [configuration, materials, product, woodStains, upholsteryOptions]);

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
  };

  const addToCartWithConfiguration = () => {
    if (!product || !pricingData) return;
    
    addToCart({
      productId: product.id,
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
          {/* Left Side - 3D Preview & Thumbnails (Sticky) */}
          <div className="flex gap-3 lg:sticky lg:top-6 lg:self-start">
            {/* Vertical Thumbnail List */}
            <div className="flex flex-col gap-2 w-16">
              {/* Product Images */}
              {productImages.map((imageUrl, index) => (
                <div
                  key={`img-${index}`}
                  className={`bg-gray-100 rounded p-1 cursor-pointer border-2 transition-all ${
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
                className={`bg-gray-100 rounded p-1 cursor-pointer border-2 transition-all ${
                  selectedThumbnail === productImages.length
                    ? 'border-[#254127]'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => setSelectedThumbnail(productImages.length)}
                data-testid="thumbnail-360"
              >
                <div className="aspect-square bg-gray-200 rounded flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-700">360°</div>
                    <div className="text-[7px] text-gray-500">3D</div>
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
                  className={`w-full h-[450px] cursor-grab active:cursor-grabbing ${
                    selectedThumbnail === productImages.length ? 'block' : 'hidden'
                  }`}
                  data-testid="3d-preview"
                />
                
                {/* Show selected product image when image thumbnail is selected */}
                {selectedThumbnail < productImages.length && (
                  <div className="w-full h-[450px] flex items-center justify-center bg-white">
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

            {/* Chair Type Section - Only show for chairs */}
            {(product.category?.toLowerCase().includes('chair') || product.name?.toLowerCase().includes('chair')) && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      <span className="mr-2">1.</span>Type
                      {configuration.chairType && (
                        <span className="ml-3 text-sm font-normal text-gray-600">
                          {configuration.chairType === 'armchair' ? 'Dining Armchair' : 'Armless Dining Chair'}
                        </span>
                      )}
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <span className="text-sm">2 options</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={`py-4 px-6 border-2 rounded transition-all text-center ${
                        configuration.chairType === 'armchair' || !configuration.chairType
                          ? 'border-black bg-white'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                      onClick={() => updateConfiguration('chairType', 'armchair')}
                      data-testid="type-armchair"
                    >
                      <div className="font-medium text-gray-900">Dining<br />Armchair</div>
                    </button>
                    <button
                      className={`py-4 px-6 border-2 rounded transition-all text-center ${
                        configuration.chairType === 'armless'
                          ? 'border-black bg-white'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                      onClick={() => updateConfiguration('chairType', 'armless')}
                      data-testid="type-armless"
                    >
                      <div className="font-medium text-gray-900">Armless Dining<br />Chair</div>
                    </button>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* 2. Wood Type Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <span className="mr-2">{(product.category?.toLowerCase().includes('chair') || product.name?.toLowerCase().includes('chair')) ? '2.' : '1.'}</span>
                  Wood Type
                  {configuration.woodType && woodTypes.length > 0 && (() => {
                    const selected = woodTypes.find((w: any) => w.id === configuration.woodType);
                    return selected ? (
                      <span className="ml-3 text-sm font-normal text-gray-600">
                        {selected.name} - {selected.type}
                      </span>
                    ) : null;
                  })()}
                </h3>
                {woodTypes.length > 0 ? (
                  <NestedAssetSelector
                    assets={woodTypes}
                    value={configuration.woodType || null}
                    onChange={(value) => updateConfiguration('woodType', value)}
                    placeholder="Choose wood type"
                    className="mt-3"
                  />
                ) : (
                  <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No wood type options available</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* 3. Wood Stain Section - Color Swatches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  <span className="mr-2">{(product.category?.toLowerCase().includes('chair') || product.name?.toLowerCase().includes('chair')) ? '3.' : '2.'}</span>
                  Wood Stain
                </h3>
                {woodStains.length > 0 && (
                  <button className="text-gray-400 hover:text-gray-600">
                    <span className="text-sm">{woodStains.length + 1} options</span>
                  </button>
                )}
              </div>
              
              {woodStains.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {/* Original/Default option */}
                  <div
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => updateConfiguration('woodStain', 'original')}
                    data-testid="stain-original"
                  >
                    <div
                      className={`w-full aspect-square rounded border-2 transition-all relative bg-gradient-to-br from-amber-100 to-amber-200 ${
                        configuration.woodStain === 'original' || !configuration.woodStain
                          ? 'border-[#254127] border-4'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">
                        🪵
                      </div>
                      {(configuration.woodStain === 'original' || !configuration.woodStain) && (
                        <div className="absolute top-1 right-1">
                          <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#254127]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-sm font-medium text-gray-900">Original</div>
                    </div>
                  </div>
                  
                  {/* Wood stain options */}
                  {woodStains.map((stain: any) => {
                    const isSelected = configuration.woodStain === stain.id;
                    return (
                      <div
                        key={stain.id}
                        className="flex flex-col items-center cursor-pointer"
                        onClick={() => updateConfiguration('woodStain', stain.id)}
                        data-testid={`stain-${stain.id}`}
                      >
                        <div
                          className={`w-full aspect-square rounded border-2 transition-all relative ${
                            isSelected
                              ? 'border-[#254127] border-4'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: stain.color || '#B8860B' }}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center">
                                <svg className="w-4 h-4 text-[#254127]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <div className="text-sm font-medium text-gray-900">{stain.name}</div>
                          {stain.priceModifier && stain.priceModifier !== '0' && (
                            <div className="text-xs text-gray-500">{stain.priceModifier}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <p className="text-sm text-gray-500">No wood stain options available yet</p>
                </div>
              )}
            </div>

            <Separator />

            {/* 4. Upholstery Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <span className="mr-2">{(product.category?.toLowerCase().includes('chair') || product.name?.toLowerCase().includes('chair')) ? '4.' : '3.'}</span>
                  Upholstery
                  {configuration.upholstery && upholsteryOptions.length > 0 && (() => {
                    const selected = upholsteryOptions.find((f: any) => f.id === configuration.upholstery);
                    return selected ? (
                      <span className="ml-3 text-sm font-normal text-gray-600">
                        {selected.name} - {selected.type}
                      </span>
                    ) : null;
                  })()}
                </h3>
                {upholsteryOptions.length > 0 ? (
                  <NestedAssetSelector
                    assets={upholsteryOptions}
                    value={configuration.upholstery || null}
                    onChange={(value) => updateConfiguration('upholstery', value)}
                    placeholder="Choose upholstery"
                    className="mt-3"
                    showColorSwatch={true}
                  />
                ) : (
                  <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No upholstery options available</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* 5. Hardware Finish Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <span className="mr-2">{(product.category?.toLowerCase().includes('chair') || product.name?.toLowerCase().includes('chair')) ? '5.' : '4.'}</span>
                  Hardware Finish
                  {configuration.hardware && hardwareOptions.length > 0 && (() => {
                    const selected = hardwareOptions.find((h: any) => h.id === configuration.hardware);
                    return selected ? (
                      <span className="ml-3 text-sm font-normal text-gray-600">
                        {selected.name} - {selected.type}
                      </span>
                    ) : null;
                  })()}
                </h3>
                {hardwareOptions.length > 0 ? (
                  <NestedAssetSelector
                    assets={hardwareOptions}
                    value={configuration.hardware || null}
                    onChange={(value) => updateConfiguration('hardware', value)}
                    placeholder="Choose hardware finish"
                    className="mt-3"
                  />
                ) : (
                  <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No hardware options available</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* 6. Surface Finish Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <span className="mr-2">{(product.category?.toLowerCase().includes('chair') || product.name?.toLowerCase().includes('chair')) ? '6.' : '5.'}</span>
                  Surface Finish
                  {configuration.finish && surfaceFinishOptions.length > 0 && (() => {
                    const selected = surfaceFinishOptions.find((f: any) => f.id === configuration.finish);
                    return selected ? (
                      <span className="ml-3 text-sm font-normal text-gray-600">
                        {selected.name} - {selected.type}
                      </span>
                    ) : null;
                  })()}
                </h3>
                {surfaceFinishOptions.length > 0 ? (
                  <NestedAssetSelector
                    assets={surfaceFinishOptions}
                    value={configuration.finish || null}
                    onChange={(value) => updateConfiguration('finish', value)}
                    placeholder="Choose surface finish"
                    className="mt-3"
                  />
                ) : (
                  <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No surface finish options available</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* 7. Dimensions Section - Now at the end */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                <span className="mr-2">{(product.category?.toLowerCase().includes('chair') || product.name?.toLowerCase().includes('chair')) ? '7.' : '6.'}</span>
                Adjust Dimensions
              </h3>
              
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
              <Button
                onClick={addToCartWithConfiguration}
                className="w-full bg-[#254127] hover:bg-[#1a2f1b] h-14 text-lg"
                data-testid="add-to-cart"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              
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
              
              {/* Wishlist Button */}
              <Button
                variant="outline"
                onClick={() => {
                  if (!isAuthenticated) {
                    toast({
                      title: "Login required",
                      description: "Please log in to save items to your wishlist",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (productId) {
                    toggleWishlist(productId);
                  }
                }}
                disabled={wishlistPending}
                className="w-full"
                data-testid="save-to-wishlist"
              >
                <Star className={`h-4 w-4 mr-2 ${isInWishlist(productId || '') ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {isInWishlist(productId || '') ? 'Saved to Wishlist' : 'Save for Later'}
              </Button>
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
