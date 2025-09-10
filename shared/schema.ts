import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  username: varchar("username").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  googleId: varchar("google_id").unique(),
  profileImage: varchar("profile_image"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  refreshToken: varchar("refresh_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

// Product Configurator Schema
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  basePrice: varchar("base_price").notNull(), // stored as string to avoid float precision issues
  isCustomizable: boolean("is_customizable").default(true),
  status: varchar("status").default("active"), // active, inactive, discontinued
  imageUrl: varchar("image_url"),
  model3dUrl: varchar("model_3d_url"), // URL to 3D model file
  dimensions: text("dimensions"), // JSON string for default dimensions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // wood, metal, fabric, etc.
  description: text("description"),
  priceMultiplier: varchar("price_multiplier").notNull(), // multiplier for base price
  textureUrl: varchar("texture_url"), // URL to texture image
  color: varchar("color"), // hex color code
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const configurationOptions = pgTable("configuration_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  category: varchar("category").notNull(), // dimensions, material, color, hardware
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // dropdown, slider, color-picker, checkbox
  options: text("options"), // JSON array of available options
  defaultValue: varchar("default_value"),
  priceImpact: varchar("price_impact").default("0"), // additional cost/discount
  isRequired: boolean("is_required").default(false),
  sortOrder: varchar("sort_order").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedConfigurations = pgTable("saved_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  productId: varchar("product_id").notNull(),
  name: varchar("name"), // user-given name for the configuration
  configuration: text("configuration").notNull(), // JSON string of all selections
  totalPrice: varchar("total_price").notNull(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Configuration schemas for validation
export const createConfigurationSchema = z.object({
  productId: z.string(),
  configuration: z.record(z.any()), // flexible object for any configuration
  name: z.string().optional(),
});

export const updateConfigurationSchema = z.object({
  configuration: z.record(z.any()),
  name: z.string().optional(),
});

export const pricingRequestSchema = z.object({
  productId: z.string(),
  configuration: z.record(z.any()),
});

// Types
export type Product = typeof products.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type ConfigurationOption = typeof configurationOptions.$inferSelect;
export type SavedConfiguration = typeof savedConfigurations.$inferSelect;
export type CreateConfigurationRequest = z.infer<typeof createConfigurationSchema>;
export type UpdateConfigurationRequest = z.infer<typeof updateConfigurationSchema>;
export type PricingRequest = z.infer<typeof pricingRequestSchema>;
