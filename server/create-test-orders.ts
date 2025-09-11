import { db } from './db';
import { orders, orderItems, users, products, addresses, orderStatusHistory } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function createTestOrders() {
  try {
    console.log('Creating test orders...');

    // Get existing products
    const existingProducts = await db.select().from(products).limit(4);
    
    if (existingProducts.length === 0) {
      console.log('No products found. Please run seeding first.');
      return;
    }

    // Check if we have any users
    const existingUsers = await db.select().from(users).limit(1);
    
    let testUserId: string;
    
    if (existingUsers.length === 0) {
      // Create a test user
      const [testUser] = await db.insert(users).values({
        email: 'test@teaktheory.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        hashedPassword: 'dummy_hash',
        emailVerified: true,
        role: 'user'
      }).returning();
      testUserId = testUser.id;
      console.log('Created test user');
    } else {
      testUserId = existingUsers[0].id;
    }

    // Create test address
    const [testAddress] = await db.insert(addresses).values({
      userId: testUserId,
      label: 'Home',
      firstName: 'John',
      lastName: 'Doe',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      phone: '555-0123',
      isDefault: true
    }).returning();

    // Create test orders
    const testOrdersData = [
      {
        orderNumber: `ORDER-${Date.now()}-1`,
        userId: testUserId,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'stripe',
        subtotal: '1250.00',
        totalAmount: '1325.00',
        taxAmount: '75.00',
        shippingAmount: '0.00',
        discountAmount: '0.00',
        refundableAmount: '1325.00',
        shippingAddressId: testAddress.id,
        billingAddressId: testAddress.id
      },
      {
        orderNumber: `ORDER-${Date.now()}-2`,
        userId: testUserId,
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'paypal',
        subtotal: '2650.00',
        totalAmount: '2811.25',
        taxAmount: '161.25',
        shippingAmount: '0.00',
        discountAmount: '0.00',
        refundableAmount: '2811.25',
        shippingAddressId: testAddress.id,
        billingAddressId: testAddress.id
      },
      {
        orderNumber: `ORDER-${Date.now()}-3`,
        userId: testUserId,
        status: 'shipped',
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
        subtotal: '850.00',
        totalAmount: '901.25',
        taxAmount: '51.25',
        shippingAmount: '0.00',
        discountAmount: '0.00',
        refundableAmount: '901.25',
        trackingNumber: 'TRK123456789',
        shippingCarrier: 'FedEx',
        shippingAddressId: testAddress.id,
        billingAddressId: testAddress.id
      }
    ];

    for (let i = 0; i < testOrdersData.length; i++) {
      const orderData = testOrdersData[i];
      
      // Create order
      const [order] = await db.insert(orders).values(orderData).returning();
      
      // Create order items
      const selectedProducts = existingProducts.slice(0, Math.min(2, existingProducts.length));
      
      for (const product of selectedProducts) {
        const quantity = Math.floor(Math.random() * 2) + 1;
        const unitPrice = parseFloat(product.basePrice);
        const totalPrice = unitPrice * quantity;
        
        await db.insert(orderItems).values({
          orderId: order.id,
          productId: product.id,
          quantity: quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: totalPrice.toFixed(2),
          productName: product.name,
          productImage: product.imageUrl
        });
      }
      
      // Add status history
      await db.insert(orderStatusHistory).values({
        orderId: order.id,
        status: order.status,
        comment: `Order ${order.status}`
      });
      
      console.log(`Created test order ${order.orderNumber}`);
    }

    console.log('Test orders created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating test orders:', error);
    throw error;
  }
}

// Run if called directly
createTestOrders().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});