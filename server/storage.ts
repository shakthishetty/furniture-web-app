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
  users, 
  sessions,
  products,
  materials,
  configurationOptions,
  savedConfigurations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
