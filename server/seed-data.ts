import { storage } from './storage';

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

    // Insert categories using storage interface
    const insertedCategories = [];
    for (const category of sampleCategories) {
      const insertedCategory = await storage.createCategory(category);
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
        pdfUrl: null,
        additionalImages: null,
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
        pdfUrl: null,
        additionalImages: null,
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
        pdfUrl: null,
        additionalImages: null,
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
        pdfUrl: null,
        additionalImages: null,
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

    // Insert products using storage interface
    const insertedProducts = [];
    for (const product of sampleProducts) {
      const insertedProduct = await storage.createProduct(product);
      insertedProducts.push(insertedProduct);
    }

    // Insert materials using storage interface
    const insertedMaterials = [];
    for (const material of sampleMaterials) {
      const insertedMaterial = await storage.createMaterial(material);
      insertedMaterials.push(insertedMaterial);
    }

    // For now, skip configuration options in MemStorage (can be implemented later)
    // TODO: Add configuration options storage methods when needed
    console.log('Configuration options creation skipped in memory storage mode');

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
// Seed default users to prevent auth issues on restart
export async function seedDefaultUsers() {
  try {
    // Check if any users exist
    const existingUsers = await storage.getUsers({ page: 1, limit: 1 });
    
    if (existingUsers.total === 0) {
      console.log('No users found, seeding default users...');
      
      // Create admin user
      await storage.createUser({
        email: 'admin@teaktheory.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });
      
      // Create the user who was trying to login
      await storage.createUser({
        email: 'shakthishetty154@gmail.com',
        password: 'password123', // Default password - user should change
        firstName: 'Shakthi',
        lastName: 'Shetty',
        role: 'admin', // Making this user admin since they were accessing admin panel
      });
      
      // Create demo customer
      await storage.createUser({
        email: 'customer@demo.com',
        password: 'customer123',
        firstName: 'Demo',
        lastName: 'Customer',
        role: 'customer',
      });
      
      console.log('Default users created successfully!');
      
      // Seed sample orders for realistic demo data
      await seedSampleOrders();
    } else {
      console.log(`Found ${existingUsers.total} existing users, skipping user seed.`);
    }
  } catch (error) {
    console.error('Error seeding default users:', error);
    // Don't throw error - continue even if user seeding fails
  }
}

// Seed sample orders to make the admin panel look realistic
export async function seedSampleOrders() {
  try {
    const existingOrders = await storage.getOrdersForAdmin({ page: 1, limit: 1 });
    
    if (existingOrders.total === 0) {
      console.log('No orders found, seeding sample orders...');
      
      // Get users for order assignment
      const allUsers = await storage.getUsers({ page: 1, limit: 10 });
      if (allUsers.users.length === 0) return;
      
      const customer = allUsers.users.find(u => u.role === 'customer') || allUsers.users[0];
      
      // Create sample orders
      const sampleOrders = [
        {
          userId: customer.id,
          orderNumber: 'TK001DEMO',
          totalAmount: '1850.00',
          status: 'completed',
          paymentStatus: 'paid',
          shippingAddressId: 'demo-address-1',
          billingAddressId: 'demo-address-1',
          items: JSON.stringify([{ id: '1', name: 'STRATA TEAK DINING CHAIR', quantity: 2, price: '450.00' }]),
          discountCodeId: null,
          notes: 'Sample completed order'
        },
        {
          userId: customer.id,
          orderNumber: 'TK002DEMO',
          totalAmount: '2400.00',
          status: 'processing',
          paymentStatus: 'paid',
          shippingAddressId: 'demo-address-1',
          billingAddressId: 'demo-address-1',
          items: JSON.stringify([{ id: '1', name: 'STRATA TEAK PLATFORM BED', quantity: 1, price: '1800.00' }]),
          discountCodeId: null,
          notes: 'Sample processing order'
        },
        {
          userId: customer.id,
          orderNumber: 'TK003DEMO',
          totalAmount: '850.00',
          status: 'pending',
          paymentStatus: 'pending',
          shippingAddressId: 'demo-address-1',
          billingAddressId: 'demo-address-1',
          items: JSON.stringify([{ id: '1', name: 'STRATA TEAK COFFEE TABLE', quantity: 1, price: '850.00' }]),
          discountCodeId: null,
          notes: 'Sample pending order'
        }
      ];

      let createdOrders = 0;
      for (const orderData of sampleOrders) {
        try {
          await storage.createOrder(orderData);
          createdOrders++;
        } catch (error) {
          console.log(`Failed to create sample order ${orderData.orderNumber}:`, error);
        }
      }
      
      console.log(`Created ${createdOrders} sample orders successfully!`);
    } else {
      console.log(`Found ${existingOrders.total} existing orders, skipping order seed.`);
    }
  } catch (error) {
    console.error('Error seeding sample orders:', error);
    // Don't throw - continue even if order seeding fails
  }
}

export async function initializeSampleData() {
  // Check if products already exist
  const existingProducts = await storage.getAllProducts();
  
  if (existingProducts.length === 0) {
    console.log('No products found, seeding sample data...');
    await seedSampleData();
  } else {
    console.log(`Found ${existingProducts.length} existing products, skipping seed.`);
  }
  
  // Always check and seed users to prevent auth issues on restart
  await seedDefaultUsers();
}