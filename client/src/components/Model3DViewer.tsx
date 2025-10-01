import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Model3DViewerProps {
  modelUrl: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Model3DViewer({ modelUrl, width = 300, height = 200, className = "" }: Model3DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const modelRef = useRef<THREE.Group>();
  const animationIdRef = useRef<number>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelUrl) {
      setError('No model URL provided');
      setLoading(false);
      return;
    }
    
    if (!canvasRef.current) {
      setError('Canvas element not available');
      setLoading(false);
      return;
    }
    
    // Clean up previous scene
    cleanup();
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Load the 3D model
    const loader = new GLTFLoader();
    
    // Set up Draco decoder for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);
    
    // Add timeout to detect stuck loading
    const loadTimeout = setTimeout(() => {
      setError('Model loading timeout - file may be too large or corrupted');
      setLoading(false);
    }, 30000);
    
    loader.load(
      modelUrl,
      (gltf) => {
        clearTimeout(loadTimeout);
        const model = gltf.scene;
        
        // Add shadows to the model
        model.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        
        // Scale to fit in view
        const scale = 1.5 / maxSize;
        model.scale.setScalar(scale);
        
        // Center the model
        model.position.sub(center.multiplyScalar(scale));
        
        scene.add(model);
        modelRef.current = model;
        setLoading(false);
        setError(null);
      },
      undefined,
      (error: unknown) => {
        clearTimeout(loadTimeout);
        if (error instanceof Error) {
          setError(`Failed to load 3D model: ${error.message}`);
        } else {
          setError('Failed to load 3D model');
        }
        setLoading(false);
      }
    );

    // Mouse controls for rotation
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown || !modelRef.current) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      modelRef.current.rotation.y += deltaX * 0.01;
      modelRef.current.rotation.x += deltaY * 0.01;
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    canvasRef.current.addEventListener('mousedown', handleMouseDown);
    canvasRef.current.addEventListener('mouseup', handleMouseUp);
    canvasRef.current.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      clearTimeout(loadTimeout);
      dracoLoader.dispose();
      cleanup();
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown);
      canvasRef.current?.removeEventListener('mouseup', handleMouseUp);
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove);
    };
  }, [modelUrl, width, height]);

  const cleanup = () => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (sceneRef.current) {
      while (sceneRef.current.children.length > 0) {
        sceneRef.current.remove(sceneRef.current.children[0]);
      }
    }
  };

  return (
    <div className={`relative border rounded ${className}`} style={{ width, height }}>
      {/* Canvas is always rendered */}
      <canvas 
        ref={canvasRef} 
        className="cursor-grab active:cursor-grabbing rounded"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <div className="text-sm text-muted-foreground">Loading 3D model...</div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded p-4">
          <Alert className="w-full">
            <AlertDescription className="text-center">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Control hint */}
      {!loading && !error && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/80 px-2 py-1 rounded">
          Drag to rotate
        </div>
      )}
    </div>
  );
}
