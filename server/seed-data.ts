import { storage } from './storage';
import { db } from './db';
import { products, materials, configurationOptions, discountCodes } from '@shared/schema';

export async function seedSampleData() {
  try {
    console.log('Seeding sample data...');

    // Insert sample products
    const sampleProducts = [
      {
        name: 'STRATA TEAK DINING CHAIR',
        description: 'Modern dining chair crafted from sustainable teak wood with ergonomic design.',
        category: 'dining',
        basePrice: '450.00',
        isCustomizable: true,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500',
        model3dUrl: '/models/dining-chair.glb',
        dimensions: JSON.stringify({ width: 18, height: 32, depth: 20 }),
      },
      {
        name: 'STRATA TEAK COFFEE TABLE',
        description: 'Elegant coffee table with clean lines and natural teak finish.',
        category: 'living-room',
        basePrice: '850.00',
        isCustomizable: true,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1549497538-303791108f95?w=500',
        model3dUrl: '/models/coffee-table.glb',
        dimensions: JSON.stringify({ width: 48, height: 16, depth: 24 }),
      },
      {
        name: 'STRATA TEAK PLATFORM BED',
        description: 'Minimalist platform bed with integrated nightstands.',
        category: 'bedroom',
        basePrice: '1800.00',
        isCustomizable: true,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
        model3dUrl: '/models/platform-bed.glb',
        dimensions: JSON.stringify({ width: 60, height: 12, depth: 80 }),
      },
      {
        name: 'STRATA TEAK DESK',
        description: 'Executive desk with built-in cable management and drawers.',
        category: 'study',
        basePrice: '1200.00',
        isCustomizable: true,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        model3dUrl: '/models/desk.glb',
        dimensions: JSON.stringify({ width: 60, height: 30, depth: 24 }),
      },
    ];

    // Insert sample materials
    const sampleMaterials = [
      {
        name: 'Natural Teak',
        type: 'wood',
        description: 'Premium grade A teak with natural oil finish',
        priceMultiplier: '1.0',
        textureUrl: '/textures/teak-natural.jpg',
        color: '#8B4513',
        isAvailable: true,
      },
      {
        name: 'Dark Teak',
        type: 'wood',
        description: 'Rich dark teak with ebony stain',
        priceMultiplier: '1.15',
        textureUrl: '/textures/teak-dark.jpg',
        color: '#654321',
        isAvailable: true,
      },
      {
        name: 'Light Teak',
        type: 'wood',
        description: 'Light golden teak with clear finish',
        priceMultiplier: '1.05',
        textureUrl: '/textures/teak-light.jpg',
        color: '#DEB887',
        isAvailable: true,
      },
      {
        name: 'Weathered Teak',
        type: 'wood',
        description: 'Naturally weathered teak for outdoor use',
        priceMultiplier: '1.25',
        textureUrl: '/textures/teak-weathered.jpg',
        color: '#A0522D',
        isAvailable: true,
      },
    ];

    // Insert products
    const insertedProducts = [];
    for (const product of sampleProducts) {
      const [insertedProduct] = await db.insert(products).values(product).returning();
      insertedProducts.push(insertedProduct);
    }

    // Insert materials
    const insertedMaterials = [];
    for (const material of sampleMaterials) {
      const [insertedMaterial] = await db.insert(materials).values(material).returning();
      insertedMaterials.push(insertedMaterial);
    }

    // Insert configuration options for each product
    for (const product of insertedProducts) {
      const productOptions = [
        {
          productId: product.id,
          category: 'material',
          name: 'Wood Type',
          type: 'dropdown',
          options: JSON.stringify(insertedMaterials.map(m => ({ id: m.id, name: m.name }))),
          defaultValue: insertedMaterials[0].id,
          priceImpact: '0',
          isRequired: true,
          sortOrder: '1',
        },
        {
          productId: product.id,
          category: 'dimensions',
          name: 'Custom Dimensions',
          type: 'slider',
          options: JSON.stringify({ min: 12, max: 72, step: 1 }),
          defaultValue: '24',
          priceImpact: '0',
          isRequired: false,
          sortOrder: '2',
        },
        {
          productId: product.id,
          category: 'hardware',
          name: 'Hardware Finish',
          type: 'dropdown',
          options: JSON.stringify([
            { id: 'brass', name: 'Brass', price: 25 },
            { id: 'chrome', name: 'Chrome', price: 15 },
            { id: 'black', name: 'Matte Black', price: 20 },
            { id: 'nickel', name: 'Brushed Nickel', price: 30 },
          ]),
          defaultValue: 'brass',
          priceImpact: '25',
          isRequired: true,
          sortOrder: '3',
        },
        {
          productId: product.id,
          category: 'finish',
          name: 'Surface Finish',
          type: 'dropdown',
          options: JSON.stringify([
            { id: 'natural', name: 'Natural Oil', price: 0 },
            { id: 'satin', name: 'Satin Lacquer', price: 50 },
            { id: 'gloss', name: 'High Gloss', price: 75 },
            { id: 'matte', name: 'Matte Finish', price: 40 },
          ]),
          defaultValue: 'natural',
          priceImpact: '0',
          isRequired: true,
          sortOrder: '4',
        },
      ];

      for (const option of productOptions) {
        await db.insert(configurationOptions).values(option);
      }
    }

    // Insert sample discount codes
    const sampleDiscountCodes = [
      {
        code: 'WELCOME10',
        description: '10% off for new customers',
        discountType: 'percentage',
        discountValue: '10.00',
        minimumOrderAmount: '100.00',
        maxUsageCount: 100,
        currentUsageCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      },
      {
        code: 'SAVE25',
        description: '$25 off orders over $200',
        discountType: 'fixed',
        discountValue: '25.00',
        minimumOrderAmount: '200.00',
        maxUsageCount: 50,
        currentUsageCount: 0,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        isActive: true,
      },
      {
        code: 'TEAKTEST',
        description: '15% off for testing',
        discountType: 'percentage',
        discountValue: '15.00',
        minimumOrderAmount: '0.00',
        maxUsageCount: null, // unlimited
        currentUsageCount: 0,
        expiresAt: null, // no expiration
        isActive: true,
      },
    ];

    let insertedDiscountCodes: any[] = [];
    for (const discount of sampleDiscountCodes) {
      try {
        const existing = await storage.getDiscountCode(discount.code);
        if (!existing) {
          const insertedDiscount = await storage.createDiscountCode(discount);
          insertedDiscountCodes.push(insertedDiscount);
        }
      } catch (error) {
        console.log(`Discount code ${discount.code} may already exist, skipping.`);
      }
    }

    console.log('Sample data seeded successfully!');
    console.log(`Inserted ${insertedProducts.length} products`);
    console.log(`Inserted ${insertedMaterials.length} materials`);
    console.log(`Inserted ${insertedProducts.length * 4} configuration options`);
    console.log(`Inserted ${insertedDiscountCodes.length} discount codes`);

    return {
      products: insertedProducts,
      materials: insertedMaterials,
    };
  } catch (error) {
    console.error('Error seeding sample data:', error);
    throw error;
  }
}

// Run this function to seed data
export async function initializeSampleData() {
  // Check if products already exist
  const existingProducts = await storage.getAllProducts();
  
  if (existingProducts.length === 0) {
    console.log('No products found, seeding sample data...');
    await seedSampleData();
  } else {
    console.log(`Found ${existingProducts.length} existing products, skipping seed.`);
  }
}