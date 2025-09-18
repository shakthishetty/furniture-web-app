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