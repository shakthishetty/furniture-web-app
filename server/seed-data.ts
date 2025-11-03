import { storage } from './storage';
import { db } from './db';
import { products, materials, configurationOptions, discounts, categories } from '@shared/schema';

export async function seedSampleData() {
  try {
    console.log('Seeding sample data...');

    // Insert sample categories first
    const sampleCategories = [
      {
        name: 'Dining Room',
        description: 'Dining chairs, tables, and dining room furniture',
        slug: 'dining',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Living Room',
        description: 'Coffee tables, sofas, and living room furniture',
        slug: 'living-room',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'Bedroom',
        description: 'Beds, dressers, and bedroom furniture',
        slug: 'bedroom',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'Study',
        description: 'Desks, bookshelves, and study furniture',
        slug: 'study',
        sortOrder: 4,
        isActive: true,
      },
      {
        name: 'Outdoor',
        description: 'Outdoor and patio furniture',
        slug: 'outdoor',
        sortOrder: 5,
        isActive: true,
      },
    ];

    // Insert categories
    const insertedCategories = [];
    for (const category of sampleCategories) {
      const [insertedCategory] = await db.insert(categories).values(category).returning();
      insertedCategories.push(insertedCategory);
    }

    // Create category lookup map
    const categoryMap = insertedCategories.reduce((map, cat) => {
      map[cat.slug] = cat.id;
      return map;
    }, {} as Record<string, string>);

    // Insert sample products with proper category references
    const sampleProducts = [
      {
        name: 'STRATA TEAK DINING CHAIR',
        description: 'Modern dining chair crafted from sustainable teak wood with ergonomic design.',
        categoryId: categoryMap['dining'],
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
        categoryId: categoryMap['living-room'],
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
        categoryId: categoryMap['bedroom'],
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
        categoryId: categoryMap['study'],
        category: 'study',
        basePrice: '1200.00',
        isCustomizable: true,
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500',
        model3dUrl: '/models/desk.glb',
        dimensions: JSON.stringify({ width: 60, height: 30, depth: 24 }),
      },
    ];

    // Insert sample materials - Indian Market Defaults organized by subType
    const sampleMaterials = [
      // Wood Types (subType: 'wood-type')
      {
        name: 'Teak Wood',
        type: 'wood',
        subType: 'wood-type',
        description: 'Premium grade A teak, highly durable and weather-resistant',
        priceMultiplier: '1.0',
        textureUrl: 'https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?w=400',
        color: '#8B4513',
        isAvailable: true,
      },
      {
        name: 'Sheesham Wood',
        type: 'wood',
        subType: 'wood-type',
        description: 'Indian rosewood with rich grain patterns',
        priceMultiplier: '0.85',
        textureUrl: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=400',
        color: '#654321',
        isAvailable: true,
      },
      {
        name: 'Oak Wood',
        type: 'wood',
        subType: 'wood-type',
        description: 'Strong hardwood with distinctive grain',
        priceMultiplier: '1.15',
        textureUrl: 'https://images.unsplash.com/photo-1623330188915-89f30df5ad2c?w=400',
        color: '#A0826D',
        isAvailable: true,
      },
      {
        name: 'Mahogany Wood',
        type: 'wood',
        subType: 'wood-type',
        description: 'Luxurious reddish-brown hardwood',
        priceMultiplier: '1.25',
        textureUrl: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400',
        color: '#C04000',
        isAvailable: true,
      },
      {
        name: 'Mango Wood',
        type: 'wood',
        subType: 'wood-type',
        description: 'Sustainable and eco-friendly wood with unique character',
        priceMultiplier: '0.75',
        textureUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400',
        color: '#DEB887',
        isAvailable: true,
      },
      
      // Wood Stains (subType: 'wood-stain')
      {
        name: 'Natural Finish',
        type: 'wood',
        subType: 'wood-stain',
        description: 'Clear protective coat preserving natural wood color',
        priceMultiplier: '1.0',
        priceModifier: '0',
        textureUrl: 'https://images.unsplash.com/photo-1615875221248-e7c47b3f3c2e?w=400',
        color: '#D2B48C',
        isAvailable: true,
      },
      {
        name: 'Walnut Stain',
        type: 'wood',
        subType: 'wood-stain',
        description: 'Rich dark brown stain with warm undertones',
        priceMultiplier: '1.0',
        priceModifier: '+500',
        textureUrl: 'https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400',
        color: '#5C4033',
        isAvailable: true,
      },
      {
        name: 'Honey Oak Stain',
        type: 'wood',
        subType: 'wood-stain',
        description: 'Warm golden amber finish',
        priceMultiplier: '1.0',
        priceModifier: '+500',
        textureUrl: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400',
        color: '#CC7722',
        isAvailable: true,
      },
      {
        name: 'Espresso Stain',
        type: 'wood',
        subType: 'wood-stain',
        description: 'Deep dark chocolate brown finish',
        priceMultiplier: '1.0',
        priceModifier: '+750',
        textureUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400',
        color: '#3B2F2F',
        isAvailable: true,
      },
      {
        name: 'Wenge Stain',
        type: 'wood',
        subType: 'wood-stain',
        description: 'Contemporary dark finish with subtle grain highlight',
        priceMultiplier: '1.0',
        priceModifier: '+750',
        textureUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400',
        color: '#645452',
        isAvailable: true,
      },
      
      // Fabrics (subType: 'upholstery')
      {
        name: 'Premium Cotton',
        type: 'fabric',
        subType: 'upholstery',
        description: 'Soft breathable cotton fabric, perfect for daily use',
        priceMultiplier: '1.0',
        priceModifier: '0',
        textureUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400',
        color: '#F5F5DC',
        isAvailable: true,
      },
      {
        name: 'Velvet Upholstery',
        type: 'fabric',
        subType: 'upholstery',
        description: 'Luxurious velvet with rich texture and sheen',
        priceMultiplier: '1.35',
        priceModifier: '+2000',
        textureUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400',
        color: '#8B7355',
        isAvailable: true,
      },
      {
        name: 'Linen Fabric',
        type: 'fabric',
        subType: 'upholstery',
        description: 'Natural linen with excellent durability',
        priceMultiplier: '1.15',
        priceModifier: '+1000',
        textureUrl: 'https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6?w=400',
        color: '#E6D2B8',
        isAvailable: true,
      },
      {
        name: 'Jute Weave',
        type: 'fabric',
        subType: 'upholstery',
        description: 'Eco-friendly jute with rustic charm',
        priceMultiplier: '0.90',
        priceModifier: '+500',
        textureUrl: 'https://images.unsplash.com/photo-1594115524146-e63351a5ace6?w=400',
        color: '#C9A876',
        isAvailable: true,
      },
      
      // Hardware (subType: 'hardware')
      {
        name: 'Brass Hardware',
        type: 'metal',
        subType: 'hardware',
        description: 'Classic brass fittings with antique finish',
        priceMultiplier: '1.0',
        priceModifier: '+1500',
        textureUrl: 'https://images.unsplash.com/photo-1596920743436-66e30a3d9b2f?w=400',
        color: '#B5A642',
        isAvailable: true,
      },
      {
        name: 'Stainless Steel',
        type: 'metal',
        subType: 'hardware',
        description: 'Modern brushed stainless steel hardware',
        priceMultiplier: '1.0',
        priceModifier: '+1000',
        textureUrl: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400',
        color: '#C0C0C0',
        isAvailable: true,
      },
      {
        name: 'Black Matte',
        type: 'metal',
        subType: 'hardware',
        description: 'Contemporary matte black finish',
        priceMultiplier: '1.0',
        priceModifier: '+1200',
        textureUrl: 'https://images.unsplash.com/photo-1551029506-0807df4e2031?w=400',
        color: '#2C2C2C',
        isAvailable: true,
      },
      {
        name: 'Antique Copper',
        type: 'metal',
        subType: 'hardware',
        description: 'Vintage copper hardware with patina',
        priceMultiplier: '1.0',
        priceModifier: '+1800',
        textureUrl: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400',
        color: '#B87333',
        isAvailable: true,
      },
      
      // Surface Finishes (subType: 'surface-finish')
      {
        name: 'Matte Finish',
        type: 'finish',
        subType: 'surface-finish',
        description: 'Non-reflective smooth matte surface',
        priceMultiplier: '1.0',
        priceModifier: '0',
        textureUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400',
        color: '#D4C5B9',
        isAvailable: true,
      },
      {
        name: 'Glossy Finish',
        type: 'finish',
        subType: 'surface-finish',
        description: 'High-shine glossy protective coat',
        priceMultiplier: '1.0',
        priceModifier: '+800',
        textureUrl: 'https://images.unsplash.com/photo-1603909406787-b732c6ea2bd6?w=400',
        color: '#E8D7C3',
        isAvailable: true,
      },
      {
        name: 'Semi-Gloss',
        type: 'finish',
        subType: 'surface-finish',
        description: 'Balanced sheen with easy maintenance',
        priceMultiplier: '1.0',
        priceModifier: '+600',
        textureUrl: 'https://images.unsplash.com/photo-1633626520720-e94aa8f29e44?w=400',
        color: '#DCC9B4',
        isAvailable: true,
      },
      {
        name: 'Satin Finish',
        type: 'finish',
        subType: 'surface-finish',
        description: 'Smooth low-luster finish',
        priceMultiplier: '1.0',
        priceModifier: '+500',
        textureUrl: 'https://images.unsplash.com/photo-1615875221248-e7c47b3f3c2e?w=400',
        color: '#E0CEB8',
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
        const existing = await storage.getDiscount(discount.discountCode);
        if (!existing) {
          const insertedDiscount = await storage.createDiscount(discount);
          insertedDiscountCodes.push(insertedDiscount);
        }
      } catch (error) {
        console.log(`Discount code ${discount.discountCode} may already exist, skipping.`);
      }
    }

    console.log('Sample data seeded successfully!');
    console.log(`Inserted ${insertedCategories.length} categories`);
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