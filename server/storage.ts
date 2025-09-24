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
  type Category,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
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
  type ManufacturingProcess,
  type ManufacturingStage,
  type StageUpdate,
  type StageUpdatePhoto,
  type StageUpdateReply,
  type CreateManufacturingProcessRequest,
  type UpdateManufacturingProcessRequest,
  type CreateManufacturingStageRequest,
  type UpdateManufacturingStageRequest,
  type CreateStageUpdateRequest,
  type CreateStageUpdateReplyRequest,
  type ManufacturingStatusUpdateRequest,
  type StageStatusUpdateRequest,
  type ManufacturerProfile,
  type CreateManufacturerProfileRequest,
  type ApproveManufacturerRequest,
  type RejectManufacturerRequest,
  type Manufacturer,
  type CreateManufacturerRequest,
  type UpdateManufacturerRequest,
  users, 
  sessions,
  products,
  materials,
  configurationOptions,
  savedConfigurations,
  categories,
  addresses,
  discountCodes,
  orders,
  orderItems,
  orderStatusHistory,
  refunds,
  wishlist,
  manufacturingProcesses,
  manufacturingStages,
  stageUpdates,
  stageUpdatePhotos,
  stageUpdateReplies,
  manufacturerProfiles,
  manufacturers
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, sql, or, ilike, gte, lte, desc, inArray } from "drizzle-orm";
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
  deleteUser(id: string): Promise<boolean>;
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
  deleteProduct(id: string): Promise<boolean>;
  
  // Categories
  getCategories(options?: { page?: number; limit?: number; parentId?: string; isActive?: boolean }): Promise<{ categories: Category[]; total: number; page: number; limit: number; totalPages: number }>;
  getCategoryById(categoryId: string): Promise<Category | null>;
  createCategory(category: CreateCategoryRequest): Promise<Category>;
  updateCategory(categoryId: string, updates: UpdateCategoryRequest): Promise<Category | null>;
  deleteCategory(categoryId: string): Promise<boolean>;
  getProductsByCategoryId(categoryId: string): Promise<Product[]>;
  
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
  getDiscountCodes(options: { page: number; limit: number }): Promise<{ discounts: DiscountCode[]; total: number }>;
  getDiscountCodeById(id: string): Promise<DiscountCode | undefined>;
  updateDiscountCode(id: string, updates: Partial<DiscountCode>): Promise<DiscountCode | undefined>;
  deleteDiscountCode(id: string): Promise<boolean>;
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

  // Admin operations
  getUserById(id: string): Promise<User | undefined>; // Alias for getUser
  getUsers(options: { page: number; limit: number; search?: string; status?: string }): Promise<{ users: User[]; total: number }>;
  getManufacturers(): Promise<User[]>; // Get all users with manufacturer role
  getProducts(options: { page: number; limit: number; category?: string; status?: string }): Promise<{ products: Product[]; total: number }>;
  createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  getOrdersForAdmin(options: { page: number; limit: number; status?: string; startDate?: Date; endDate?: Date }): Promise<{ orders: any[]; total: number }>;
  getAnalyticsSummary(): Promise<{ revenue: number; orders: number; users: number; avgOrderValue: number }>;
  getOrdersByDay(days: number): Promise<{ date: string; orders: number; revenue: number }[]>;

  // Manufacturing Tracking operations
  createManufacturingProcess(processData: CreateManufacturingProcessRequest): Promise<ManufacturingProcess>;
  getManufacturingProcesses(options: { page: number; limit: number; status?: string; orderId?: string; manufacturerId?: string }): Promise<{ processes: (ManufacturingProcess & { assignedManufacturer?: User | null })[]; total: number }>;
  getManufacturingProcess(id: string): Promise<ManufacturingProcess | undefined>;
  getManufacturingProcessWithManufacturer(id: string): Promise<(ManufacturingProcess & { assignedManufacturer?: User | null }) | undefined>;
  getManufacturingProcessByOrderId(orderId: string): Promise<ManufacturingProcess | undefined>;
  updateManufacturingProcess(id: string, updates: ManufacturingStatusUpdateRequest): Promise<ManufacturingProcess | undefined>;
  assignManufacturerToProcess(processId: string, manufacturerId: string | null): Promise<ManufacturingProcess | undefined>;
  deleteManufacturingProcess(id: string): Promise<boolean>;

  // Manufacturing Stages operations
  createManufacturingStage(stageData: CreateManufacturingStageRequest): Promise<ManufacturingStage>;
  getManufacturingStages(processId: string): Promise<ManufacturingStage[]>;
  getManufacturingStage(id: string): Promise<ManufacturingStage | undefined>;
  updateManufacturingStage(id: string, updates: StageStatusUpdateRequest): Promise<ManufacturingStage | undefined>;
  deleteManufacturingStage(id: string): Promise<boolean>;

  // Stage Approval Workflow operations
  submitStageForApproval(stageId: string, manufacturerId: string): Promise<ManufacturingStage | undefined>;
  approveStage(stageId: string, adminUserId: string, approvalComment?: string): Promise<ManufacturingStage | undefined>;
  rejectStage(stageId: string, adminUserId: string, rejectionReason: string): Promise<ManufacturingStage | undefined>;
  getStagesAwaitingApproval(): Promise<(ManufacturingStage & { process: ManufacturingProcess; assignedManufacturer?: User | null })[]>;
  getNextPendingStage(processId: string): Promise<ManufacturingStage | undefined>;

  // Stage Updates operations
  createStageUpdate(updateData: CreateStageUpdateRequest): Promise<StageUpdate>;
  getStageUpdates(stageId: string, includeInternal?: boolean): Promise<(StageUpdate & { photos: StageUpdatePhoto[]; replies: StageUpdateReply[] })[]>;
  getStageUpdate(id: string): Promise<(StageUpdate & { photos: StageUpdatePhoto[]; replies: StageUpdateReply[] }) | undefined>;

  // Stage Update Replies operations
  createStageUpdateReply(replyData: CreateStageUpdateReplyRequest): Promise<StageUpdateReply>;
  getStageUpdateReplies(updateId: string): Promise<StageUpdateReply[]>;

  // Manufacturing Process with full details
  getManufacturingProcessWithDetails(id: string): Promise<(ManufacturingProcess & { 
    assignedManufacturer?: User | null;
    stages: (ManufacturingStage & { 
      updates: (StageUpdate & { photos: StageUpdatePhoto[]; replies: StageUpdateReply[] })[] 
    })[] 
  }) | undefined>;

  // Manufacturer Profile operations (application-based)
  createManufacturerProfile(userId: string, profileData: CreateManufacturerProfileRequest): Promise<ManufacturerProfile>;
  getManufacturerProfile(userId: string): Promise<ManufacturerProfile | undefined>;
  getManufacturerProfileById(id: string): Promise<ManufacturerProfile | undefined>;
  updateManufacturerProfile(id: string, updates: Partial<ManufacturerProfile>): Promise<ManufacturerProfile | undefined>;
  approveManufacturer(id: string, adminUserId: string, notes?: string): Promise<ManufacturerProfile | undefined>;
  rejectManufacturer(id: string, adminUserId: string, reason: string, notes?: string): Promise<ManufacturerProfile | undefined>;
  getPendingManufacturerApplications(): Promise<(ManufacturerProfile & { user: User })[]>;
  getApprovedManufacturers(): Promise<(ManufacturerProfile & { user: User })[]>;

  // Simple Manufacturer operations (direct admin creation)
  createDirectManufacturer(manufacturerData: CreateManufacturerRequest, adminUserId: string): Promise<Manufacturer>;
  getDirectManufacturers(): Promise<Manufacturer[]>;
  getDirectManufacturer(id: string): Promise<Manufacturer | undefined>;
  updateDirectManufacturer(id: string, updates: UpdateManufacturerRequest): Promise<Manufacturer | undefined>;
  deleteDirectManufacturer(id: string): Promise<boolean>;
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

  async deleteUser(id: string): Promise<boolean> {
    try {
      // Delete all user-related data first (cascading delete)
      await db.delete(sessions).where(eq(sessions.userId, id));
      await db.delete(savedConfigurations).where(eq(savedConfigurations.userId, id));
      await db.delete(addresses).where(eq(addresses.userId, id));
      await db.delete(wishlist).where(eq(wishlist.userId, id));
      
      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
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

  // Category Management Methods
  async getCategories(options?: { page?: number; limit?: number; parentId?: string; isActive?: boolean }): Promise<{ categories: Category[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 50, parentId, isActive } = options || {};
    const offset = (page - 1) * limit;

    const conditions = [];
    if (parentId !== undefined) {
      conditions.push(eq(categories.parentId, parentId));
    }
    if (isActive !== undefined) {
      conditions.push(eq(categories.isActive, isActive));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    const baseQuery = db.select().from(categories);
    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(categories);

    const query = whereClause ? baseQuery.where(whereClause) : baseQuery;
    const countQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;

    const [categoryResults, countResults] = await Promise.all([
      query.orderBy(categories.sortOrder, categories.name).limit(limit).offset(offset),
      countQuery
    ]);

    const total = countResults[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      categories: categoryResults,
      total,
      page,
      limit,
      totalPages
    };
  }

  async getCategoryById(categoryId: string): Promise<Category | null> {
    const [category] = await db.select().from(categories).where(eq(categories.id, categoryId));
    return category || null;
  }

  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    // Generate slug from name if not provided
    const slug = categoryData.slug || categoryData.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();

    const [category] = await db.insert(categories).values({
      ...categoryData,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return category;
  }

  async updateCategory(categoryId: string, updates: UpdateCategoryRequest): Promise<Category | null> {
    // Generate slug from name if name is being updated and slug is not provided
    if (updates.name && !updates.slug) {
      updates.slug = updates.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim();
    }

    const [category] = await db.update(categories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId))
      .returning();

    return category || null;
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, categoryId));
    return (result.rowCount ?? 0) > 0;
  }

  async getProductsByCategoryId(categoryId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
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

  async getDiscountCodes(options: { page: number; limit: number }): Promise<{ discounts: DiscountCode[]; total: number }> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    const base = db.select().from(discountCodes);
    const baseCount = db.select({ count: sql<number>`count(*)` }).from(discountCodes);

    const [discountsResult, totalResult] = await Promise.all([
      base.orderBy(discountCodes.createdAt).limit(limit).offset(offset),
      baseCount
    ]);

    return {
      discounts: discountsResult,
      total: Number(totalResult[0]?.count) || 0
    };
  }

  async getDiscountCodeById(id: string): Promise<DiscountCode | undefined> {
    const [discount] = await db.select().from(discountCodes)
      .where(eq(discountCodes.id, id));
    return discount;
  }

  async updateDiscountCode(id: string, updates: Partial<DiscountCode>): Promise<DiscountCode | undefined> {
    const processedUpdates: any = { ...updates, updatedAt: new Date() };
    
    // Convert expiresAt string to Date if provided
    if (updates.expiresAt && typeof updates.expiresAt === 'string') {
      processedUpdates.expiresAt = new Date(updates.expiresAt);
    }
    
    const [discount] = await db
      .update(discountCodes)
      .set(processedUpdates)
      .where(eq(discountCodes.id, id))
      .returning();
    
    return discount;
  }

  async deleteDiscountCode(id: string): Promise<boolean> {
    const result = await db
      .delete(discountCodes)
      .where(eq(discountCodes.id, id))
      .returning({ id: discountCodes.id });
    
    return result.length > 0;
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

  // Admin operations
  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id); // Alias for existing getUser method
  }

  async getUsers(options: { page: number; limit: number; search?: string; status?: string }): Promise<{ users: User[]; total: number }> {
    const { page, limit, search, status } = options;
    const offset = (page - 1) * limit;

    const base = db.select().from(users);
    const baseCount = db.select({ count: sql<number>`count(*)` }).from(users);

    const conditions = [
      search ? or(
        ilike(users.email, `%${search}%`),
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`)
      ) : undefined,
      status ? eq(users.status, status) : undefined,
    ].filter(Boolean) as any[];

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const listQuery = whereClause ? base.where(whereClause) : base;
    const countQuery = whereClause ? baseCount.where(whereClause) : baseCount;

    const [usersResult, totalResult] = await Promise.all([
      listQuery.orderBy(users.createdAt).limit(limit).offset(offset),
      countQuery
    ]);

    return {
      users: usersResult,
      total: totalResult[0]?.count || 0
    };
  }

  async getManufacturers(): Promise<User[]> {
    return await db.select().from(users)
      .where(and(
        eq(users.role, 'manufacturer'),
        eq(users.status, 'active')
      ))
      .orderBy(users.firstName, users.lastName);
  }

  async getProducts(options: { page: number; limit: number; category?: string; status?: string }): Promise<{ products: Product[]; total: number }> {
    const { page, limit, category, status } = options;
    const offset = (page - 1) * limit;

    const base = db.select().from(products);
    const baseCount = db.select({ count: sql<number>`count(*)` }).from(products);

    const conditions = [
      category ? eq(products.category, category) : undefined,
      status ? eq(products.status, status) : undefined,
    ].filter(Boolean) as any[];

    const whereClause = conditions.length ? and(...conditions) : undefined;
    const listQuery = whereClause ? base.where(whereClause) : base;
    const countQuery = whereClause ? baseCount.where(whereClause) : baseCount;

    const [productsResult, totalResult] = await Promise.all([
      listQuery.orderBy(products.createdAt).limit(limit).offset(offset),
      countQuery
    ]);

    return {
      products: productsResult,
      total: totalResult[0]?.count || 0
    };
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(products)
        .where(eq(products.id, id));
      
      return result.rowCount! > 0;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  async getOrdersForAdmin(options: { page: number; limit: number; status?: string; startDate?: Date; endDate?: Date }): Promise<{ orders: any[]; total: number }> {
    const { page, limit, status, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    const conditions = [
      status ? eq(orders.status, status) : undefined,
      startDate ? gte(orders.createdAt, startDate) : undefined,
      endDate ? lte(orders.createdAt, endDate) : undefined,
    ].filter(Boolean) as any[];

    const whereClause = conditions.length ? and(...conditions) : undefined;

    // Get total count
    const baseCount = db.select({ count: sql<number>`count(*)` }).from(orders);
    const countQuery = whereClause ? baseCount.where(whereClause) : baseCount;
    const [totalResult] = await countQuery;

    // Get orders with user and address info
    const baseQuery = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        subtotal: orders.subtotal,
        discountAmount: orders.discountAmount,
        taxAmount: orders.taxAmount,
        shippingAmount: orders.shippingAmount,
        totalAmount: orders.totalAmount,
        trackingNumber: orders.trackingNumber,
        shippingCarrier: orders.shippingCarrier,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        userEmail: users.email,
        userName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        shippingStreet: addresses.street,
        shippingApartment: addresses.apartment,
        shippingCity: addresses.city,
        shippingState: addresses.state,
        shippingPostalCode: addresses.postalCode,
        shippingCountry: addresses.country,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(addresses, eq(orders.shippingAddressId, addresses.id));

    const ordersQuery = whereClause 
      ? baseQuery.where(whereClause) 
      : baseQuery;

    const ordersResult = await ordersQuery
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get order items for each order
    const orderIds = ordersResult.map(order => order.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          productName: orderItems.productName,
          quantity: orderItems.quantity,
          price: orderItems.unitPrice,
          total: orderItems.totalPrice,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));
    }

    // Group items by order ID
    const itemsByOrderId = items.reduce((acc, item) => {
      if (!acc[item.orderId]) acc[item.orderId] = [];
      acc[item.orderId].push({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.total),
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Transform orders to match frontend interface
    const transformedOrders = ordersResult.map(order => ({
      id: order.id,
      userId: order.userId,
      userEmail: order.userEmail || 'N/A',
      userName: order.userName || 'N/A',
      status: order.status,
      total: parseFloat(order.totalAmount),
      items: itemsByOrderId[order.id] || [],
      shippingAddress: {
        street: order.shippingStreet || 'N/A',
        city: order.shippingCity || 'N/A',
        state: order.shippingState || 'N/A',
        zipCode: order.shippingPostalCode || 'N/A',
        country: order.shippingCountry || 'N/A',
      },
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: order.updatedAt?.toISOString() || new Date().toISOString(),
      trackingNumber: order.trackingNumber,
    }));

    return {
      orders: transformedOrders,
      total: totalResult?.count || 0
    };
  }

  async getAnalyticsSummary(): Promise<{ revenue: number; orders: number; users: number; avgOrderValue: number }> {
    const [revenueResult, ordersResult, usersResult] = await Promise.all([
      db.select({ total: sql<number>`sum(cast(${orders.totalAmount} as decimal))` }).from(orders).where(eq(orders.paymentStatus, 'paid')),
      db.select({ count: sql<number>`count(*)` }).from(orders),
      db.select({ count: sql<number>`count(*)` }).from(users)
    ]);

    const revenue = Number(revenueResult[0]?.total || 0);
    const orderCount = ordersResult[0]?.count || 0;
    const userCount = usersResult[0]?.count || 0;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

    return {
      revenue,
      orders: orderCount,
      users: userCount,
      avgOrderValue
    };
  }

  async getOrdersByDay(days: number): Promise<{ date: string; orders: number; revenue: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`date(${orders.createdAt})`,
        orders: sql<number>`count(*)`,
        revenue: sql<number>`sum(cast(${orders.totalAmount} as decimal))`
      })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${startDate}`)
      .groupBy(sql`date(${orders.createdAt})`)
      .orderBy(sql`date(${orders.createdAt})`);

    return result.map(row => ({
      date: row.date,
      orders: row.orders,
      revenue: Number(row.revenue || 0)
    }));
  }

  // Manufacturing Tracking implementations
  async createManufacturingProcess(processData: CreateManufacturingProcessRequest): Promise<ManufacturingProcess> {
    const [process] = await db
      .insert(manufacturingProcesses)
      .values({
        ...processData,
        updatedAt: new Date(),
      })
      .returning();
    
    return process;
  }

  async getManufacturingProcesses(options: { page: number; limit: number; status?: string; orderId?: string; manufacturerId?: string }): Promise<{ processes: (ManufacturingProcess & { assignedManufacturer?: User | null })[]; total: number }> {
    const { page, limit, status, orderId, manufacturerId } = options;
    const offset = (page - 1) * limit;

    const conditions = [
      status ? eq(manufacturingProcesses.status, status) : undefined,
      orderId ? eq(manufacturingProcesses.orderId, orderId) : undefined,
      manufacturerId ? eq(manufacturingProcesses.assignedManufacturerId, manufacturerId) : undefined,
    ].filter(Boolean) as any[];

    const whereClause = conditions.length ? and(...conditions) : undefined;
    
    // Join with users table to get manufacturer details
    const baseQuery = db
      .select({
        id: manufacturingProcesses.id,
        orderId: manufacturingProcesses.orderId,
        status: manufacturingProcesses.status,
        currentStageId: manufacturingProcesses.currentStageId,
        assignedManufacturerId: manufacturingProcesses.assignedManufacturerId,
        startedAt: manufacturingProcesses.startedAt,
        completedAt: manufacturingProcesses.completedAt,
        estimatedCompletionDate: manufacturingProcesses.estimatedCompletionDate,
        notes: manufacturingProcesses.notes,
        createdAt: manufacturingProcesses.createdAt,
        updatedAt: manufacturingProcesses.updatedAt,
        manufacturerId: users.id,
        manufacturerEmail: users.email,
        manufacturerFirstName: users.firstName,
        manufacturerLastName: users.lastName,
        manufacturerRole: users.role,
        manufacturerStatus: users.status
      })
      .from(manufacturingProcesses)
      .leftJoin(users, eq(manufacturingProcesses.assignedManufacturerId, users.id));

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(manufacturingProcesses);

    const listQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;
    const totalQuery = whereClause ? countQuery.where(whereClause) : countQuery;

    const [processesResult, totalResult] = await Promise.all([
      listQuery.orderBy(desc(manufacturingProcesses.createdAt)).limit(limit).offset(offset),
      totalQuery
    ]);

    return {
      processes: processesResult.map(row => ({
        id: row.id,
        orderId: row.orderId,
        status: row.status,
        currentStageId: row.currentStageId,
        assignedManufacturerId: row.assignedManufacturerId,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        estimatedCompletionDate: row.estimatedCompletionDate,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        assignedManufacturer: row.manufacturerId ? {
          id: row.manufacturerId,
          email: row.manufacturerEmail || '',
          firstName: row.manufacturerFirstName,
          lastName: row.manufacturerLastName,
          role: row.manufacturerRole,
          status: row.manufacturerStatus,
          username: null,
          password: null,
          googleId: null,
          profileImage: null,
          isAdmin: false,
          emailVerified: true,
          emailVerificationToken: null,
          passwordResetToken: null,
          passwordResetExpires: null,
          createdAt: null,
          updatedAt: null
        } : null
      })),
      total: totalResult[0]?.count || 0
    };
  }

  async getManufacturingProcess(id: string): Promise<ManufacturingProcess | undefined> {
    const [process] = await db
      .select()
      .from(manufacturingProcesses)
      .where(eq(manufacturingProcesses.id, id));
    
    return process;
  }

  async getManufacturingProcessWithManufacturer(id: string): Promise<(ManufacturingProcess & { assignedManufacturer?: User | null }) | undefined> {
    const [result] = await db
      .select({
        id: manufacturingProcesses.id,
        orderId: manufacturingProcesses.orderId,
        status: manufacturingProcesses.status,
        currentStageId: manufacturingProcesses.currentStageId,
        assignedManufacturerId: manufacturingProcesses.assignedManufacturerId,
        startedAt: manufacturingProcesses.startedAt,
        completedAt: manufacturingProcesses.completedAt,
        estimatedCompletionDate: manufacturingProcesses.estimatedCompletionDate,
        notes: manufacturingProcesses.notes,
        createdAt: manufacturingProcesses.createdAt,
        updatedAt: manufacturingProcesses.updatedAt,
        manufacturerId: users.id,
        manufacturerEmail: users.email,
        manufacturerFirstName: users.firstName,
        manufacturerLastName: users.lastName,
        manufacturerRole: users.role,
        manufacturerStatus: users.status
      })
      .from(manufacturingProcesses)
      .leftJoin(users, eq(manufacturingProcesses.assignedManufacturerId, users.id))
      .where(eq(manufacturingProcesses.id, id));
    
    if (!result) return undefined;

    return {
      id: result.id,
      orderId: result.orderId,
      status: result.status,
      currentStageId: result.currentStageId,
      assignedManufacturerId: result.assignedManufacturerId,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      estimatedCompletionDate: result.estimatedCompletionDate,
      notes: result.notes,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      assignedManufacturer: result.manufacturerId ? {
        id: result.manufacturerId,
        email: result.manufacturerEmail || '',
        firstName: result.manufacturerFirstName,
        lastName: result.manufacturerLastName,
        role: result.manufacturerRole,
        status: result.manufacturerStatus,
        username: null,
        password: null,
        googleId: null,
        profileImage: null,
        isAdmin: false,
        emailVerified: true,
        emailVerificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        createdAt: null,
        updatedAt: null
      } : null
    };
  }

  async getManufacturingProcessByOrderId(orderId: string): Promise<ManufacturingProcess | undefined> {
    const [process] = await db
      .select()
      .from(manufacturingProcesses)
      .where(eq(manufacturingProcesses.orderId, orderId));
    
    return process;
  }

  async updateManufacturingProcess(id: string, updates: ManufacturingStatusUpdateRequest): Promise<ManufacturingProcess | undefined> {
    const [process] = await db
      .update(manufacturingProcesses)
      .set({ 
        ...updates, 
        estimatedCompletionDate: updates.estimatedCompletionDate ? new Date(updates.estimatedCompletionDate) : undefined,
        updatedAt: new Date() 
      })
      .where(eq(manufacturingProcesses.id, id))
      .returning();
    
    return process;
  }

  async assignManufacturerToProcess(processId: string, manufacturerId: string | null): Promise<ManufacturingProcess | undefined> {
    let userIdToAssign = manufacturerId;

    // If manufacturerId is provided, find the corresponding user ID
    if (manufacturerId) {
      // Check if this is already a user ID (if it can log in as manufacturer)
      const userCheck = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, manufacturerId), eq(users.role, 'manufacturer')))
        .limit(1);

      if (userCheck.length === 0) {
        // This is a manufacturer table ID, find the corresponding user ID
        const manufacturer = await db
          .select({ email: manufacturers.email })
          .from(manufacturers)
          .where(eq(manufacturers.id, manufacturerId))
          .limit(1);

        if (manufacturer.length > 0) {
          // Find user with matching email and manufacturer role
          const correspondingUser = await db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.email, manufacturer[0].email), eq(users.role, 'manufacturer')))
            .limit(1);

          if (correspondingUser.length > 0) {
            userIdToAssign = correspondingUser[0].id;
          } else {
            // No corresponding user found, assignment will fail
            console.warn(`No user found for manufacturer ${manufacturerId} with email ${manufacturer[0].email}`);
          }
        }
      }
    }

    const [process] = await db
      .update(manufacturingProcesses)
      .set({ 
        assignedManufacturerId: userIdToAssign,
        updatedAt: new Date() 
      })
      .where(eq(manufacturingProcesses.id, processId))
      .returning();
    
    return process;
  }

  async deleteManufacturingProcess(id: string): Promise<boolean> {
    const result = await db
      .delete(manufacturingProcesses)
      .where(eq(manufacturingProcesses.id, id));
    
    return (result.rowCount ?? 0) > 0;
  }

  async createManufacturingStage(stageData: CreateManufacturingStageRequest): Promise<ManufacturingStage> {
    const [stage] = await db
      .insert(manufacturingStages)
      .values({
        ...stageData,
        updatedAt: new Date(),
      })
      .returning();
    
    return stage;
  }

  async getManufacturingStages(processId: string): Promise<ManufacturingStage[]> {
    const stages = await db
      .select()
      .from(manufacturingStages)
      .where(eq(manufacturingStages.processId, processId))
      .orderBy(manufacturingStages.position);
    
    return stages;
  }

  async getManufacturingStage(id: string): Promise<ManufacturingStage | undefined> {
    const [stage] = await db
      .select()
      .from(manufacturingStages)
      .where(eq(manufacturingStages.id, id));
    
    return stage;
  }

  async updateManufacturingStage(id: string, updates: StageStatusUpdateRequest): Promise<ManufacturingStage | undefined> {
    // Enforce workflow rules - prevent bypassing approval process
    if (updates.status) {
      if (updates.status === "awaiting_approval") {
        throw new Error("Cannot set status to 'awaiting_approval' directly. Use submitStageForApproval method.");
      }
      if (updates.status === "completed") {
        throw new Error("Cannot set status to 'completed' directly. Stage must be approved through approval workflow.");
      }
      if (updates.status === "rejected") {
        throw new Error("Cannot set status to 'rejected' directly. Use rejectStage method.");
      }
    }

    const updateData = {
      ...updates,
      startedAt: updates.startedAt ? new Date(updates.startedAt) : undefined,
      completedAt: updates.completedAt ? new Date(updates.completedAt) : undefined,
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const [stage] = await db
      .update(manufacturingStages)
      .set(updateData)
      .where(eq(manufacturingStages.id, id))
      .returning();
    
    return stage;
  }

  async deleteManufacturingStage(id: string): Promise<boolean> {
    const result = await db
      .delete(manufacturingStages)
      .where(eq(manufacturingStages.id, id));
    
    return (result.rowCount ?? 0) > 0;
  }

  // Stage Approval Workflow Methods
  async submitStageForApproval(stageId: string, manufacturerId: string): Promise<ManufacturingStage | undefined> {
    // Verify stage is in progress and manufacturer is authorized
    const currentStage = await db
      .select({
        stage: manufacturingStages,
        process: manufacturingProcesses
      })
      .from(manufacturingStages)
      .leftJoin(manufacturingProcesses, eq(manufacturingStages.processId, manufacturingProcesses.id))
      .where(eq(manufacturingStages.id, stageId))
      .limit(1);

    if (!currentStage[0]) {
      throw new Error("Stage not found");
    }

    const { stage, process } = currentStage[0];
    
    // Validate current status
    if (stage.status !== "in_progress") {
      throw new Error(`Cannot submit stage with status "${stage.status}". Stage must be in_progress.`);
    }

    // Validate manufacturer authorization
    const isAuthorized = stage.assignedToUserId === manufacturerId || 
                        process?.assignedManufacturerId === manufacturerId;
    if (!isAuthorized) {
      throw new Error("Manufacturer not authorized for this stage");
    }

    const [updatedStage] = await db
      .update(manufacturingStages)
      .set({
        status: "awaiting_approval",
        submittedAt: new Date(),
        submittedBy: manufacturerId,
        updatedAt: new Date()
      })
      .where(eq(manufacturingStages.id, stageId))
      .returning();
    
    return updatedStage;
  }

  async approveStage(stageId: string, adminUserId: string, approvalComment?: string): Promise<ManufacturingStage | undefined> {
    return await db.transaction(async (tx) => {
      // Verify stage is awaiting approval
      const [currentStage] = await tx
        .select()
        .from(manufacturingStages)
        .where(eq(manufacturingStages.id, stageId))
        .limit(1);

      if (!currentStage) {
        throw new Error("Stage not found");
      }

      if (currentStage.status !== "awaiting_approval") {
        throw new Error(`Cannot approve stage with status "${currentStage.status}". Stage must be awaiting_approval.`);
      }

      // Update stage to completed
      const [approvedStage] = await tx
        .update(manufacturingStages)
        .set({
          status: "completed",
          completedAt: new Date(),
          approvedAt: new Date(),
          approvedBy: adminUserId,
          approvalComment: approvalComment || null,
          updatedAt: new Date()
        })
        .where(eq(manufacturingStages.id, stageId))
        .returning();

      // Check for next pending stage in sequence
      const [nextStage] = await tx
        .select()
        .from(manufacturingStages)
        .where(
          and(
            eq(manufacturingStages.processId, currentStage.processId),
            eq(manufacturingStages.status, "pending")
          )
        )
        .orderBy(manufacturingStages.position)
        .limit(1);

      if (nextStage) {
        // Start next stage
        await tx
          .update(manufacturingStages)
          .set({
            status: "in_progress",
            startedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(manufacturingStages.id, nextStage.id));

        // Update process current stage
        await tx
          .update(manufacturingProcesses)
          .set({
            currentStageId: nextStage.id,
            updatedAt: new Date()
          })
          .where(eq(manufacturingProcesses.id, currentStage.processId));
      } else {
        // No more stages - complete the process
        await tx
          .update(manufacturingProcesses)
          .set({
            status: "completed",
            completedAt: new Date(),
            currentStageId: null,
            updatedAt: new Date()
          })
          .where(eq(manufacturingProcesses.id, currentStage.processId));
      }

      return approvedStage;
    });
  }

  async rejectStage(stageId: string, adminUserId: string, rejectionReason: string): Promise<ManufacturingStage | undefined> {
    // Verify stage is awaiting approval
    const [currentStage] = await db
      .select()
      .from(manufacturingStages)
      .where(eq(manufacturingStages.id, stageId))
      .limit(1);

    if (!currentStage) {
      throw new Error("Stage not found");
    }

    if (currentStage.status !== "awaiting_approval") {
      throw new Error(`Cannot reject stage with status "${currentStage.status}". Stage must be awaiting_approval.`);
    }

    const [rejectedStage] = await db
      .update(manufacturingStages)
      .set({
        status: "in_progress", // Return to in_progress for rework
        rejectedAt: new Date(),
        rejectedBy: adminUserId,
        rejectionReason,
        // Clear approval submission fields for fresh submission
        submittedAt: null,
        submittedBy: null,
        updatedAt: new Date()
      })
      .where(eq(manufacturingStages.id, stageId))
      .returning();

    // Update process timestamp
    await db
      .update(manufacturingProcesses)
      .set({
        updatedAt: new Date()
      })
      .where(eq(manufacturingProcesses.id, currentStage.processId));

    return rejectedStage;
  }

  async getStagesAwaitingApproval(): Promise<(ManufacturingStage & { process: ManufacturingProcess; assignedManufacturer?: User | null })[]> {
    const stagesWithDetails = await db
      .select()
      .from(manufacturingStages)
      .leftJoin(manufacturingProcesses, eq(manufacturingStages.processId, manufacturingProcesses.id))
      .leftJoin(users, eq(manufacturingProcesses.assignedManufacturerId, users.id))
      .where(eq(manufacturingStages.status, "awaiting_approval"))
      .orderBy(manufacturingStages.submittedAt);

    return stagesWithDetails.map(row => ({
      ...row.manufacturing_stages,
      process: row.manufacturing_processes!,
      assignedManufacturer: row.users || null
    }));
  }

  async getNextPendingStage(processId: string): Promise<ManufacturingStage | undefined> {
    const [stage] = await db
      .select()
      .from(manufacturingStages)
      .where(
        and(
          eq(manufacturingStages.processId, processId),
          eq(manufacturingStages.status, "pending")
        )
      )
      .orderBy(manufacturingStages.position)
      .limit(1);

    return stage;
  }

  async createStageUpdate(updateData: CreateStageUpdateRequest): Promise<StageUpdate> {
    const { photos, ...updateFields } = updateData;
    
    const [update] = await db
      .insert(stageUpdates)
      .values(updateFields)
      .returning();

    // If photos are provided, insert them
    if (photos && photos.length > 0) {
      await db.insert(stageUpdatePhotos).values(
        photos.map(photoUrl => ({
          updateId: update.id,
          url: photoUrl,
        }))
      );
    }
    
    return update;
  }

  async getStageUpdates(stageId: string, includeInternal = false): Promise<(StageUpdate & { photos: StageUpdatePhoto[]; replies: StageUpdateReply[] })[]> {
    const conditions = [
      eq(stageUpdates.stageId, stageId),
      !includeInternal ? eq(stageUpdates.isInternal, false) : undefined,
    ].filter(Boolean) as any[];

    const whereClause = conditions.length ? and(...conditions) : undefined;
    
    const updates = await db
      .select()
      .from(stageUpdates)
      .where(whereClause)
      .orderBy(desc(stageUpdates.createdAt));

    // Get photos and replies for all updates
    const updateIds = updates.map(u => u.id);
    if (updateIds.length === 0) return [];

    const [photos, replies] = await Promise.all([
      db.select().from(stageUpdatePhotos).where(inArray(stageUpdatePhotos.updateId, updateIds)),
      db.select().from(stageUpdateReplies).where(inArray(stageUpdateReplies.updateId, updateIds))
    ]);

    // Group by update ID
    const photosByUpdate = photos.reduce((acc, photo) => {
      if (!acc[photo.updateId]) acc[photo.updateId] = [];
      acc[photo.updateId].push(photo);
      return acc;
    }, {} as Record<string, StageUpdatePhoto[]>);

    const repliesByUpdate = replies.reduce((acc, reply) => {
      if (!acc[reply.updateId]) acc[reply.updateId] = [];
      acc[reply.updateId].push(reply);
      return acc;
    }, {} as Record<string, StageUpdateReply[]>);

    return updates.map(update => ({
      ...update,
      photos: photosByUpdate[update.id] || [],
      replies: repliesByUpdate[update.id] || [],
    }));
  }

  async getStageUpdate(id: string): Promise<(StageUpdate & { photos: StageUpdatePhoto[]; replies: StageUpdateReply[] }) | undefined> {
    const [update] = await db
      .select()
      .from(stageUpdates)
      .where(eq(stageUpdates.id, id));

    if (!update) return undefined;

    const [photos, replies] = await Promise.all([
      db.select().from(stageUpdatePhotos).where(eq(stageUpdatePhotos.updateId, id)),
      db.select().from(stageUpdateReplies).where(eq(stageUpdateReplies.updateId, id))
    ]);

    return {
      ...update,
      photos,
      replies,
    };
  }

  async createStageUpdateReply(replyData: CreateStageUpdateReplyRequest): Promise<StageUpdateReply> {
    const [reply] = await db
      .insert(stageUpdateReplies)
      .values(replyData)
      .returning();
    
    return reply;
  }

  async getStageUpdateReplies(updateId: string): Promise<StageUpdateReply[]> {
    const replies = await db
      .select()
      .from(stageUpdateReplies)
      .where(eq(stageUpdateReplies.updateId, updateId))
      .orderBy(stageUpdateReplies.createdAt);
    
    return replies;
  }

  async getManufacturingProcessWithDetails(id: string): Promise<(ManufacturingProcess & { 
    assignedManufacturer?: User | null;
    stages: (ManufacturingStage & { 
      updates: (StageUpdate & { photos: StageUpdatePhoto[]; replies: StageUpdateReply[] })[] 
    })[] 
  }) | undefined> {
    const processWithManufacturer = await this.getManufacturingProcessWithManufacturer(id);
    if (!processWithManufacturer) return undefined;

    const stages = await this.getManufacturingStages(id);
    const stagesWithUpdates = await Promise.all(
      stages.map(async (stage) => {
        const updates = await this.getStageUpdates(stage.id, true); // Include internal updates for full details
        return { ...stage, updates };
      })
    );

    return {
      ...processWithManufacturer,
      stages: stagesWithUpdates,
    };
  }

  // Manufacturer Profile operations
  async createManufacturerProfile(userId: string, profileData: CreateManufacturerProfileRequest): Promise<ManufacturerProfile> {
    const [profile] = await db
      .insert(manufacturerProfiles)
      .values({
        userId,
        ...profileData,
      })
      .returning();
    
    return profile;
  }

  async getManufacturerProfile(userId: string): Promise<ManufacturerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(manufacturerProfiles)
      .where(eq(manufacturerProfiles.userId, userId));
    
    return profile;
  }

  async getManufacturerProfileById(id: string): Promise<ManufacturerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(manufacturerProfiles)
      .where(eq(manufacturerProfiles.id, id));
    
    return profile;
  }

  async updateManufacturerProfile(id: string, updates: Partial<ManufacturerProfile>): Promise<ManufacturerProfile | undefined> {
    const [updatedProfile] = await db
      .update(manufacturerProfiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(manufacturerProfiles.id, id))
      .returning();
    
    return updatedProfile;
  }

  async approveManufacturer(id: string, adminUserId: string, notes?: string): Promise<ManufacturerProfile | undefined> {
    const now = new Date();
    
    // First update the manufacturer profile
    const [profile] = await db
      .update(manufacturerProfiles)
      .set({
        isApproved: true,
        approvedBy: adminUserId,
        approvedAt: now,
        notes: notes || null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        updatedAt: now,
      })
      .where(eq(manufacturerProfiles.id, id))
      .returning();

    if (profile) {
      // Update user status to active
      await db
        .update(users)
        .set({
          status: 'active',
          updatedAt: now,
        })
        .where(eq(users.id, profile.userId));
    }
    
    return profile;
  }

  async rejectManufacturer(id: string, adminUserId: string, reason: string, notes?: string): Promise<ManufacturerProfile | undefined> {
    const now = new Date();
    
    // First update the manufacturer profile
    const [profile] = await db
      .update(manufacturerProfiles)
      .set({
        isApproved: false,
        rejectedBy: adminUserId,
        rejectedAt: now,
        rejectionReason: reason,
        notes: notes || null,
        approvedBy: null,
        approvedAt: null,
        updatedAt: now,
      })
      .where(eq(manufacturerProfiles.id, id))
      .returning();

    if (profile) {
      // Update user status to suspended
      await db
        .update(users)
        .set({
          status: 'suspended',
          updatedAt: now,
        })
        .where(eq(users.id, profile.userId));
    }
    
    return profile;
  }

  async getPendingManufacturerApplications(): Promise<(ManufacturerProfile & { user: User })[]> {
    const applications = await db
      .select({
        profile: manufacturerProfiles,
        user: users,
      })
      .from(manufacturerProfiles)
      .innerJoin(users, eq(manufacturerProfiles.userId, users.id))
      .where(
        and(
          eq(manufacturerProfiles.isApproved, false),
          eq(users.status, 'pending_approval'),
          eq(users.role, 'manufacturer')
        )
      )
      .orderBy(desc(manufacturerProfiles.createdAt));

    return applications.map(item => ({
      ...item.profile,
      user: item.user,
    }));
  }

  async getApprovedManufacturers(): Promise<(ManufacturerProfile & { user: User })[]> {
    const manufacturers = await db
      .select({
        profile: manufacturerProfiles,
        user: users,
      })
      .from(manufacturerProfiles)
      .innerJoin(users, eq(manufacturerProfiles.userId, users.id))
      .where(
        and(
          eq(manufacturerProfiles.isApproved, true),
          eq(users.status, 'active'),
          eq(users.role, 'manufacturer')
        )
      )
      .orderBy(desc(manufacturerProfiles.approvedAt));

    return manufacturers.map(item => ({
      ...item.profile,
      user: item.user,
    }));
  }

  // Simple Manufacturer operations (direct admin creation)
  async createDirectManufacturer(manufacturerData: CreateManufacturerRequest, adminUserId: string): Promise<Manufacturer> {
    // Create the manufacturer record
    const [manufacturer] = await db
      .insert(manufacturers)
      .values({
        ...manufacturerData,
        createdBy: adminUserId,
      })
      .returning();
    
    // Also create a user account so the manufacturer can log in
    // Check if user already exists with this email
    const existingUser = await this.getUserByEmail(manufacturerData.email);
    if (!existingUser) {
      // Create user account with default password "password"
      const hashedPassword = await hashPassword("password");
      
      await db
        .insert(users)
        .values({
          id: manufacturer.id, // Use the manufacturer ID as the user ID for consistency
          email: manufacturerData.email,
          password: hashedPassword,
          firstName: manufacturerData.name.split(' ')[0] || manufacturerData.name,
          lastName: manufacturerData.name.split(' ').slice(1).join(' ') || '',
          role: 'manufacturer',
          emailVerified: true, // Auto-verify admin-created accounts
          status: 'active',
        });
    }
    
    return manufacturer;
  }

  async getDirectManufacturers(): Promise<Manufacturer[]> {
    const allManufacturers = await db
      .select()
      .from(manufacturers)
      .where(eq(manufacturers.isActive, true))
      .orderBy(desc(manufacturers.createdAt));
    
    return allManufacturers;
  }

  async getDirectManufacturer(id: string): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db
      .select()
      .from(manufacturers)
      .where(eq(manufacturers.id, id));
    
    return manufacturer;
  }

  async updateDirectManufacturer(id: string, updates: UpdateManufacturerRequest): Promise<Manufacturer | undefined> {
    const [updatedManufacturer] = await db
      .update(manufacturers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(manufacturers.id, id))
      .returning();
    
    return updatedManufacturer;
  }

  async deleteDirectManufacturer(id: string): Promise<boolean> {
    const [updatedManufacturer] = await db
      .update(manufacturers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(manufacturers.id, id))
      .returning();
    
    return !!updatedManufacturer;
  }
}

export const storage = new DatabaseStorage();
