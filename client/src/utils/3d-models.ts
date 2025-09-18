import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Load actual GLB file
export async function loadFurnitureModel(model3dUrl: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  
  try {
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(
        model3dUrl,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });
    
    const model = gltf.scene;
    
    // Add shadows to loaded model
    model.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    return model;
  } catch (error) {
    console.error('Error loading 3D model:', error);
    throw error; // Don't fallback to synthetic models
  }
}

// Update material/color of loaded 3D models
export function updateFurnitureMaterial(furniture: THREE.Group, color: string | number) {
  furniture.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
      if (typeof color === 'string') {
        child.material.color.setHex(parseInt(color.replace('#', '0x')));
      } else {
        child.material.color.setHex(color);
      }
    }
  });
}

// Update dimensions of loaded 3D models
export function updateFurnitureDimensions(furniture: THREE.Group, dimensions: { width: number; height: number; depth: number }, productName?: string) {
  const scaleX = dimensions.width / 100; // Normalize to percentage
  const scaleY = dimensions.height / 100;
  const scaleZ = dimensions.depth / 100;
  
  furniture.scale.set(scaleX, scaleY, scaleZ);
}

// Simple fallback model for when GLB files are not available
export function createFallbackModel(): THREE.Group {
  const fallbackGroup = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
  
  // Create a simple furniture-like shape (box with legs)
  const mainGeometry = new THREE.BoxGeometry(2, 0.2, 1.2);
  const main = new THREE.Mesh(mainGeometry, material);
  main.position.set(0, 1.5, 0);
  fallbackGroup.add(main);
  
  // Add simple legs
  const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.4);
  const legPositions = [[-0.8, 0.7, -0.5], [0.8, 0.7, -0.5], [-0.8, 0.7, 0.5], [0.8, 0.7, 0.5]];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(pos[0], pos[1], pos[2]);
    fallbackGroup.add(leg);
  });
  
  // Add shadows
  fallbackGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  return fallbackGroup;
}