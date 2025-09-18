import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Load actual GLB file instead of creating synthetic models
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
    // Fall back to a default model if GLB loading fails
    return createDefaultModel();
  }
}

// Fallback function for backwards compatibility (creates synthetic models)
export function createFurnitureModel(productName: string, scene: THREE.Scene): THREE.Group {
  const furnitureGroup = new THREE.Group();
  
  // Create different 3D models based on product type
  if (productName.toLowerCase().includes('chair')) {
    furnitureGroup.add(createChairModel());
  } else if (productName.toLowerCase().includes('table') || productName.toLowerCase().includes('coffee')) {
    furnitureGroup.add(createTableModel());
  } else if (productName.toLowerCase().includes('bed')) {
    furnitureGroup.add(createBedModel());
  } else if (productName.toLowerCase().includes('desk')) {
    furnitureGroup.add(createDeskModel());
  } else {
    // Default furniture (basic box)
    furnitureGroup.add(createDefaultModel());
  }
  
  // Add shadows
  furnitureGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  return furnitureGroup;
}

function createChairModel(): THREE.Group {
  const chair = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
  
  // Seat
  const seatGeometry = new THREE.BoxGeometry(1.8, 0.1, 1.6);
  const seat = new THREE.Mesh(seatGeometry, material);
  seat.position.set(0, 1.5, 0);
  chair.add(seat);
  
  // Backrest
  const backGeometry = new THREE.BoxGeometry(1.8, 2, 0.1);
  const back = new THREE.Mesh(backGeometry, material);
  back.position.set(0, 2.5, -0.75);
  chair.add(back);
  
  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
  const legPositions = [
    [-0.7, 0.75, -0.7],
    [0.7, 0.75, -0.7],
    [-0.7, 0.75, 0.7],
    [0.7, 0.75, 0.7]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(pos[0], pos[1], pos[2]);
    chair.add(leg);
  });
  
  return chair;
}

function createTableModel(): THREE.Group {
  const table = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
  
  // Table top
  const topGeometry = new THREE.BoxGeometry(4, 0.2, 2.5);
  const top = new THREE.Mesh(topGeometry, material);
  top.position.set(0, 1.5, 0);
  table.add(top);
  
  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.4);
  const legPositions = [
    [-1.7, 0.7, -1],
    [1.7, 0.7, -1],
    [-1.7, 0.7, 1],
    [1.7, 0.7, 1]
  ];
  
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(pos[0], pos[1], pos[2]);
    table.add(leg);
  });
  
  return table;
}

function createBedModel(): THREE.Group {
  const bed = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
  const mattressMaterial = new THREE.MeshPhongMaterial({ color: 0xF5F5DC });
  
  // Bed frame base
  const frameGeometry = new THREE.BoxGeometry(6, 0.3, 8);
  const frame = new THREE.Mesh(frameGeometry, material);
  frame.position.set(0, 0.15, 0);
  bed.add(frame);
  
  // Mattress
  const mattressGeometry = new THREE.BoxGeometry(5.8, 0.8, 7.8);
  const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
  mattress.position.set(0, 0.7, 0);
  bed.add(mattress);
  
  // Headboard
  const headboardGeometry = new THREE.BoxGeometry(6, 3, 0.2);
  const headboard = new THREE.Mesh(headboardGeometry, material);
  headboard.position.set(0, 1.8, -3.9);
  bed.add(headboard);
  
  // Support legs
  const legGeometry = new THREE.BoxGeometry(0.3, 0.3, 7.8);
  const leftSupport = new THREE.Mesh(legGeometry, material);
  leftSupport.position.set(-2.5, 0.15, 0);
  bed.add(leftSupport);
  
  const rightSupport = new THREE.Mesh(legGeometry, material);
  rightSupport.position.set(2.5, 0.15, 0);
  bed.add(rightSupport);
  
  return bed;
}

function createDeskModel(): THREE.Group {
  const desk = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
  
  // Desktop
  const topGeometry = new THREE.BoxGeometry(5, 0.15, 2.5);
  const top = new THREE.Mesh(topGeometry, material);
  top.position.set(0, 2.4, 0);
  desk.add(top);
  
  // Left pedestal
  const leftPedestalGeometry = new THREE.BoxGeometry(1.2, 2.2, 2);
  const leftPedestal = new THREE.Mesh(leftPedestalGeometry, material);
  leftPedestal.position.set(-1.8, 1.1, 0);
  desk.add(leftPedestal);
  
  // Right pedestal
  const rightPedestalGeometry = new THREE.BoxGeometry(1.2, 2.2, 2);
  const rightPedestal = new THREE.Mesh(rightPedestalGeometry, material);
  rightPedestal.position.set(1.8, 1.1, 0);
  desk.add(rightPedestal);
  
  // Drawer handles (small details)
  const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1);
  const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
  
  // Left pedestal handles
  for (let i = 0; i < 3; i++) {
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(-1.2, 2.0 - (i * 0.6), 1.1);
    handle.rotation.z = Math.PI / 2;
    desk.add(handle);
  }
  
  // Right pedestal handles
  for (let i = 0; i < 3; i++) {
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(1.2, 2.0 - (i * 0.6), 1.1);
    handle.rotation.z = Math.PI / 2;
    desk.add(handle);
  }
  
  return desk;
}

function createDefaultModel(): THREE.Group {
  const defaultGroup = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
  
  const geometry = new THREE.BoxGeometry(2, 1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0.5, 0);
  defaultGroup.add(mesh);
  
  return defaultGroup;
}

export function updateFurnitureMaterial(furniture: THREE.Group, color: string | number) {
  furniture.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhongMaterial) {
      // Don't change mattress or handle colors
      if (child.material.color.getHex() !== 0xF5F5DC && child.material.color.getHex() !== 0x444444) {
        if (typeof color === 'string') {
          child.material.color.setHex(parseInt(color.replace('#', '0x')));
        } else {
          child.material.color.setHex(color);
        }
      }
    }
  });
}

export function updateFurnitureDimensions(furniture: THREE.Group, dimensions: { width: number; height: number; depth: number }, productName: string) {
  const scaleX = dimensions.width / 24; // Base width of 24
  const scaleY = dimensions.height / 30; // Base height of 30  
  const scaleZ = dimensions.depth / 18; // Base depth of 18
  
  // Apply different scaling logic based on furniture type
  if (productName.toLowerCase().includes('chair')) {
    furniture.scale.set(scaleX, scaleY, scaleZ);
  } else if (productName.toLowerCase().includes('table')) {
    furniture.scale.set(scaleX, scaleY * 0.5, scaleZ); // Tables don't scale height as much
  } else if (productName.toLowerCase().includes('bed')) {
    furniture.scale.set(scaleX, scaleY * 0.3, scaleZ); // Beds scale height minimally
  } else if (productName.toLowerCase().includes('desk')) {
    furniture.scale.set(scaleX, scaleY, scaleZ);
  } else {
    furniture.scale.set(scaleX, scaleY, scaleZ);
  }
}