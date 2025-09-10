import { 
  type User, 
  type InsertUser, 
  type Session,
  type RegisterRequest,
  type Product,
  type Material,
  type ConfigurationOption,
  type SavedConfiguration,
  type CreateConfigurationRequest,
  type UpdateConfigurationRequest,
  type Address,
  type CreateAddressRequest,
  type UpdateAddressRequest,
  type DiscountCode,
  type CreateDiscountCodeRequest,
  type Order,
  type OrderItem,
  type CreateOrderRequest,
  type CancelOrderRequest,
  type WishlistItem,
  type CreateWishlistItemRequest,
  type Refund,
  type OrderStatusHistory,
  users, 
  sessions,
  products,
  materials,
  configurationOptions,
  savedConfigurations,
  addresses,
  discountCodes,
  orders,
  orderItems,
  orderStatusHistory,
  refunds,
  wishlist
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, sql } from "drizzle-orm";
import { hashPassword, generateRandomToken } from "./utils/auth";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(userData: RegisterRequest & { emailVerificationToken?: string }): Promise<User>;
  createGoogleUser(googleData: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  verifyEmail(token: string): Promise<boolean>;
  
  // Password reset operations
  createPasswordResetToken(email: string): Promise<string | null>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Session operations
  createSession(userId: string, refreshToken: string, expiresAt: Date): Promise<Session>;
  getSession(refreshToken: string): Promise<Session | undefined>;
  deleteSession(refreshToken: string): Promise<void>;
  deleteAllUserSessions(userId: string): Promise<void>;
  
  // Product Configurator operations
  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  
  // Materials
  getAllMaterials(): Promise<Material[]>;
  getMaterialsByType(type: string): Promise<Material[]>;
  
  // Configuration Options
  getConfigurationOptions(productId: string): Promise<ConfigurationOption[]>;
  
  // Saved Configurations
  saveConfiguration(userId: string | null, config: CreateConfigurationRequest): Promise<SavedConfiguration>;
  getUserConfigurations(userId: string): Promise<SavedConfiguration[]>;
  getConfiguration(id: string): Promise<SavedConfiguration | undefined>;
  updateConfiguration(id: string, updates: UpdateConfigurationRequest): Promise<SavedConfiguration | undefined>;
  deleteConfiguration(id: string): Promise<void>;
  getPublicConfigurations(): Promise<SavedConfiguration[]>;

  // Address operations
  createAddress(userId: string, addressData: CreateAddressRequest): Promise<Address>;
  getUserAddresses(userId: string): Promise<Address[]>;
  getAddress(id: string): Promise<Address | undefined>;
  updateAddress(id: string, updates: UpdateAddressRequest): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;

  // Discount Code operations  
  createDiscountCode(codeData: CreateDiscountCodeRequest): Promise<DiscountCode>;
  getDiscountCode(code: string): Promise<DiscountCode | undefined>;
  validateDiscountCode(code: string, subtotal: number): Promise<{ valid: boolean; discount?: DiscountCode; error?: string }>;
  useDiscountCode(code: string): Promise<void>;

  // Order operations
  createOrder(orderData: CreateOrderRequest & { userId: string; orderNumber: string; subtotal: number; totalAmount: number }): Promise<Order>;
  getUserOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderWithItems(id: string): Promise<(Order & { items: OrderItem[] }) | undefined>;
  updateOrderStatus(id: string, status: string, comment?: string): Promise<Order | undefined>;
  updateOrderPayment(id: string, paymentData: { stripePaymentIntentId?: string; stripeChargeId?: string; paymentStatus: string }): Promise<Order | undefined>;
  cancelOrder(id: string, cancelData: CancelOrderRequest): Promise<Order | undefined>;

  // Order Item operations
  createOrderItem(itemData: Omit<OrderItem, 'id' | 'createdAt'>): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Refund operations
  createRefund(refundData: Omit<Refund, 'id' | 'createdAt'>): Promise<Refund>;
  getOrderRefunds(orderId: string): Promise<Refund[]>;
  updateRefundStatus(id: string, status: string, stripeRefundId?: string): Promise<Refund | undefined>;

  // Wishlist operations
  addToWishlist(userId: string, itemData: CreateWishlistItemRequest): Promise<WishlistItem>;
  getUserWishlist(userId: string): Promise<WishlistItem[]>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
  isInWishlist(userId: string, productId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: RegisterRequest & { emailVerificationToken?: string }): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);
    const emailVerificationToken = userData.emailVerificationToken || generateRandomToken();
    
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerificationToken,
        emailVerified: false,
      })
      .returning();
    
    return user;
  }

  async createGoogleUser(googleData: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...googleData,
        emailVerified: true, // Google accounts are pre-verified
      })
      .returning();
    
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.emailVerificationToken, token))
      .returning();
    
    return !!user;
  }

  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const token = generateRandomToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.updateUser(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await hashPassword(newPassword);
    
    const [user] = await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date())
        )
      )
      .returning();
    
    return !!user;
  }

  async createSession(userId: string, refreshToken: string, expiresAt: Date): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        userId,
        refreshToken,
        expiresAt,
      })
      .returning();
    
    return session;
  }

  async getSession(refreshToken: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshToken, refreshToken),
          gt(sessions.expiresAt, new Date())
        )
      );
    
    return session;
  }

  async deleteSession(refreshToken: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  // Product Configurator implementations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.status, 'active'));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(eq(products.category, category), eq(products.status, 'active')));
  }

  async getAllMaterials(): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.isAvailable, true));
  }

  async getMaterialsByType(type: string): Promise<Material[]> {
    return await db.select().from(materials)
      .where(and(eq(materials.type, type), eq(materials.isAvailable, true)));
  }

  async getConfigurationOptions(productId: string): Promise<ConfigurationOption[]> {
    return await db.select().from(configurationOptions)
      .where(eq(configurationOptions.productId, productId))
      .orderBy(configurationOptions.sortOrder);
  }

  async saveConfiguration(userId: string | null, config: CreateConfigurationRequest): Promise<SavedConfiguration> {
    const [savedConfig] = await db
      .insert(savedConfigurations)
      .values({
        userId,
        productId: config.productId,
        name: config.name,
        configuration: JSON.stringify(config.configuration),
        totalPrice: '0', // Will be calculated by pricing service
      })
      .returning();
    
    return savedConfig;
  }

  async getUserConfigurations(userId: string): Promise<SavedConfiguration[]> {
    return await db.select().from(savedConfigurations)
      .where(eq(savedConfigurations.userId, userId));
  }

  async getConfiguration(id: string): Promise<SavedConfiguration | undefined> {
    const [config] = await db.select().from(savedConfigurations)
      .where(eq(savedConfigurations.id, id));
    return config;
  }

  async updateConfiguration(id: string, updates: UpdateConfigurationRequest): Promise<SavedConfiguration | undefined> {
    const [config] = await db
      .update(savedConfigurations)
      .set({
        name: updates.name,
        configuration: JSON.stringify(updates.configuration),
        updatedAt: new Date(),
      })
      .where(eq(savedConfigurations.id, id))
      .returning();
    
    return config;
  }

  async deleteConfiguration(id: string): Promise<void> {
    await db.delete(savedConfigurations).where(eq(savedConfigurations.id, id));
  }

  async getPublicConfigurations(): Promise<SavedConfiguration[]> {
    return await db.select().from(savedConfigurations)
      .where(eq(savedConfigurations.isPublic, true));
  }

  // Address operations
  async createAddress(userId: string, addressData: CreateAddressRequest): Promise<Address> {
    const [address] = await db
      .insert(addresses)
      .values({
        userId,
        ...addressData,
      })
      .returning();
    
    return address;
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return await db.select().from(addresses)
      .where(eq(addresses.userId, userId));
  }

  async getAddress(id: string): Promise<Address | undefined> {
    const [address] = await db.select().from(addresses)
      .where(eq(addresses.id, id));
    return address;
  }

  async updateAddress(id: string, updates: UpdateAddressRequest): Promise<Address | undefined> {
    const [address] = await db
      .update(addresses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(addresses.id, id))
      .returning();
    
    return address;
  }

  async deleteAddress(id: string): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // First remove default from all user addresses
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, userId));

    // Then set the specified address as default
    await db
      .update(addresses)
      .set({ isDefault: true })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));
  }

  // Discount Code operations  
  async createDiscountCode(codeData: CreateDiscountCodeRequest): Promise<DiscountCode> {
    const [discountCode] = await db
      .insert(discountCodes)
      .values(codeData)
      .returning();
    
    return discountCode;
  }

  async getDiscountCode(code: string): Promise<DiscountCode | undefined> {
    const [discountCode] = await db.select().from(discountCodes)
      .where(eq(discountCodes.code, code));
    return discountCode;
  }

  async validateDiscountCode(code: string, subtotal: number): Promise<{ valid: boolean; discount?: DiscountCode; error?: string }> {
    const discount = await this.getDiscountCode(code);
    
    if (!discount) {
      return { valid: false, error: "Discount code not found" };
    }

    if (!discount.isActive) {
      return { valid: false, error: "Discount code is no longer active" };
    }

    if (discount.expiresAt && new Date() > discount.expiresAt) {
      return { valid: false, error: "Discount code has expired" };
    }

    const currentUsage = discount.currentUsageCount || 0;
    if (discount.maxUsageCount && currentUsage >= discount.maxUsageCount) {
      return { valid: false, error: "Discount code has reached its usage limit" };
    }

    const minOrderAmount = parseFloat(discount.minimumOrderAmount || "0");
    if (subtotal < minOrderAmount) {
      return { valid: false, error: `Minimum order amount of $${minOrderAmount} required` };
    }

    return { valid: true, discount };
  }

  async useDiscountCode(code: string): Promise<void> {
    await db
      .update(discountCodes)
      .set({ 
        currentUsageCount: sql`${discountCodes.currentUsageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(discountCodes.code, code));
  }

  // Order operations
  async createOrder(orderData: CreateOrderRequest & { userId: string; orderNumber: string; subtotal: number; totalAmount: number }): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({
        userId: orderData.userId,
        orderNumber: orderData.orderNumber,
        paymentMethod: orderData.paymentMethod,
        subtotal: orderData.subtotal.toString(),
        totalAmount: orderData.totalAmount.toString(),
        refundableAmount: orderData.totalAmount.toString(),
        shippingAddressId: orderData.shippingAddressId,
        billingAddressId: orderData.billingAddressId || orderData.shippingAddressId,
        discountCodeUsed: orderData.discountCode,
      })
      .returning();
    
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(orders.createdAt);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrderWithItems(id: string): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const items = await this.getOrderItems(id);
    return { ...order, items };
  }

  async updateOrderStatus(id: string, status: string, comment?: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    // Add to order status history
    if (order) {
      await db.insert(orderStatusHistory).values({
        orderId: id,
        status,
        comment,
      });
    }
    
    return order;
  }

  async updateOrderPayment(id: string, paymentData: { stripePaymentIntentId?: string; stripeChargeId?: string; paymentStatus: string }): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ 
        stripePaymentIntentId: paymentData.stripePaymentIntentId,
        stripeChargeId: paymentData.stripeChargeId,
        paymentStatus: paymentData.paymentStatus,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async cancelOrder(id: string, cancelData: CancelOrderRequest): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ 
        status: "canceled",
        canceledAt: new Date(),
        cancelReason: cancelData.reason,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  // Order Item operations
  async createOrderItem(itemData: Omit<OrderItem, 'id' | 'createdAt'>): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(itemData)
      .returning();
    
    return orderItem;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  // Refund operations
  async createRefund(refundData: Omit<Refund, 'id' | 'createdAt'>): Promise<Refund> {
    const [refund] = await db
      .insert(refunds)
      .values(refundData)
      .returning();
    
    return refund;
  }

  async getOrderRefunds(orderId: string): Promise<Refund[]> {
    return await db.select().from(refunds)
      .where(eq(refunds.orderId, orderId));
  }

  async updateRefundStatus(id: string, status: string, stripeRefundId?: string): Promise<Refund | undefined> {
    const [refund] = await db
      .update(refunds)
      .set({ 
        status,
        stripeRefundId,
        processedAt: status === 'processed' ? new Date() : undefined
      })
      .where(eq(refunds.id, id))
      .returning();
    
    return refund;
  }

  // Wishlist operations
  async addToWishlist(userId: string, itemData: CreateWishlistItemRequest): Promise<WishlistItem> {
    const [wishlistItem] = await db
      .insert(wishlist)
      .values({
        userId,
        ...itemData,
      })
      .returning();
    
    return wishlistItem;
  }

  async getUserWishlist(userId: string): Promise<WishlistItem[]> {
    return await db.select().from(wishlist)
      .where(eq(wishlist.userId, userId))
      .orderBy(wishlist.createdAt);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db.delete(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const [item] = await db.select().from(wishlist)
      .where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
    return !!item;
  }
}

export const storage = new DatabaseStorage();
