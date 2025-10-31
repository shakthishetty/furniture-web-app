import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Load actual GLB file
export async function loadFurnitureModel(model3dUrl: string): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  
  // Set up Draco decoder for compressed models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);
  
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
    
    // Add shadows and optimize materials for dark colors
    model.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Optimize material properties for better visibility with dark colors
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat: any) => {
          if (mat) {
            // Set roughness and metalness for PBR rendering
            if (mat.roughness !== undefined) {
              mat.roughness = 0.7; // Higher roughness = more diffuse, less glossy
            }
            if (mat.metalness !== undefined) {
              mat.metalness = 0.1; // Low metalness for wood furniture
            }
          }
        });
      }
    });
    
    // Clean up Draco loader
    dracoLoader.dispose();
    
    return model;
  } catch (error) {
    console.error('Error loading 3D model:', error);
    throw error; // Don't fallback to synthetic models
  }
}

// Update material/color of loaded 3D models
export function updateFurnitureMaterial(furniture: THREE.Group, color: string | number) {
  furniture.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material;
      
      // Handle both single materials and material arrays
      const materials = Array.isArray(material) ? material : [material];
      
      materials.forEach((mat: any) => {
        if (mat && mat.color) {
          if (typeof color === 'string') {
            mat.color.setHex(parseInt(color.replace('#', '0x')));
          } else {
            mat.color.setHex(color);
          }
          
          // Set PBR properties for better dark color visibility
          if (mat.roughness !== undefined) {
            mat.roughness = 0.7;
          }
          if (mat.metalness !== undefined) {
            mat.metalness = 0.1;
          }
          
          // Mark material for update
          mat.needsUpdate = true;
        }
      });
    }
  });
}

// Store original material colors when model loads
export function storeOriginalColors(furniture: THREE.Group) {
  furniture.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      
      materials.forEach((mat: any) => {
        if (mat && mat.color && !(mat as any).originalColor) {
          // Store the original color
          (mat as any).originalColor = mat.color.clone();
        }
      });
    }
  });
}

// Apply wood stain only to wood materials (not fabric/leather/upholstery)
export function applyWoodStain(furniture: THREE.Group, color: string | number) {
  furniture.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      
      materials.forEach((mat: any) => {
        if (mat && mat.color) {
          // Check if this material is likely wood-based (not fabric/leather)
          // We identify fabric/leather by looking for material names or properties
          const materialName = mat.name?.toLowerCase() || '';
          const meshName = (child.name || '').toLowerCase();
          
          // Skip if material/mesh name suggests it's fabric, leather, or upholstery
          const isFabric = 
            materialName.includes('fabric') || 
            materialName.includes('leather') || 
            materialName.includes('upholstery') ||
            materialName.includes('cushion') ||
            materialName.includes('textile') ||
            meshName.includes('fabric') || 
            meshName.includes('leather') || 
            meshName.includes('upholstery') ||
            meshName.includes('cushion') ||
            meshName.includes('seat_pad') ||
            meshName.includes('seat') ||
            meshName.includes('back_rest');
          
          // Only apply to wood materials
          if (!isFabric) {
            if (typeof color === 'string') {
              mat.color.setHex(parseInt(color.replace('#', '0x')));
            } else {
              mat.color.setHex(color);
            }
            
            // Set PBR properties for better dark color visibility
            if (mat.roughness !== undefined) {
              mat.roughness = 0.7;
            }
            if (mat.metalness !== undefined) {
              mat.metalness = 0.1;
            }
            
            mat.needsUpdate = true;
          }
        }
      });
    }
  });
}

// Reset materials to their original colors
export function resetToOriginalColors(furniture: THREE.Group) {
  furniture.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      
      materials.forEach((mat: any) => {
        if (mat && mat.color && (mat as any).originalColor) {
          mat.color.copy((mat as any).originalColor);
          mat.needsUpdate = true;
        }
      });
    }
  });
}

// Reset only wood materials to their original colors (preserving fabric colors)
export function resetWoodToOriginal(furniture: THREE.Group) {
  furniture.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material;
      const materials = Array.isArray(material) ? material : [material];
      
      materials.forEach((mat: any) => {
        if (mat && mat.color && (mat as any).originalColor) {
          // Check if this is a wood material (not fabric/leather)
          const materialName = mat.name?.toLowerCase() || '';
          const meshName = (child.name || '').toLowerCase();
          
          const isFabric = 
            materialName.includes('fabric') || 
            materialName.includes('leather') || 
            materialName.includes('upholstery') ||
            materialName.includes('cushion') ||
            materialName.includes('textile') ||
            meshName.includes('fabric') || 
            meshName.includes('leather') || 
            meshName.includes('upholstery') ||
            meshName.includes('cushion') ||
            meshName.includes('seat_pad');
          
          // Only reset wood materials to original
          if (!isFabric) {
            mat.color.copy((mat as any).originalColor);
            mat.needsUpdate = true;
          }
        }
      });
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
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.7,
    metalness: 0.1
  });
  
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