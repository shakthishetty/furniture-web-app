import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal } from "drizzle-orm/pg-core";
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

// Order Management Schema
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  label: varchar("label").notNull(), // "Home", "Work", etc.
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  street: varchar("street").notNull(),
  apartment: varchar("apartment"),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  postalCode: varchar("postal_code").notNull(),
  country: varchar("country").notNull().default("US"),
  phone: varchar("phone"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  description: text("description"),
  discountType: varchar("discount_type").notNull(), // "percentage" or "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumOrderAmount: decimal("minimum_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxUsageCount: integer("max_usage_count"), // null for unlimited
  currentUsageCount: integer("current_usage_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").notNull().unique(), // display-friendly order number
  userId: varchar("user_id").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, paid, processing, shipped, delivered, canceled
  paymentStatus: varchar("payment_status").notNull().default("pending"), // pending, paid, failed, refunded, partially_refunded
  paymentMethod: varchar("payment_method").notNull(), // stripe, paypal
  
  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Payment tracking
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeChargeId: varchar("stripe_charge_id"),
  paypalOrderId: varchar("paypal_order_id"),
  refundableAmount: decimal("refundable_amount", { precision: 10, scale: 2 }).notNull(), // tracks how much can still be refunded
  
  // Address references
  shippingAddressId: varchar("shipping_address_id"),
  billingAddressId: varchar("billing_address_id"),
  
  // Discount tracking
  discountCodeUsed: varchar("discount_code_used"),
  
  // Tracking
  trackingNumber: varchar("tracking_number"),
  shippingCarrier: varchar("shipping_carrier"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  
  // Order lifecycle
  canceledAt: timestamp("canceled_at"),
  cancelReason: text("cancel_reason"),
  refundPercentage: decimal("refund_percentage", { precision: 5, scale: 2 }).default("100"), // percentage refund based on policy
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  configurationId: varchar("configuration_id"), // reference to saved configuration if used
  customConfiguration: text("custom_configuration"), // JSON of product customizations
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  productName: varchar("product_name").notNull(), // snapshot of product name at order time
  productImage: varchar("product_image"), // snapshot of product image
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  status: varchar("status").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, processed, failed
  stripeRefundId: varchar("stripe_refund_id"),
  paypalRefundId: varchar("paypal_refund_id"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wishlist = pgTable("wishlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  productId: varchar("product_id").notNull(),
  configurationId: varchar("configuration_id"), // optional reference to saved configuration
  notes: text("notes"), // user notes about why they want this item
  createdAt: timestamp("created_at").defaultNow(),
});

// Order Management Schemas
export const createAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAddressSchema = createAddressSchema.partial();

export const createDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  currentUsageCount: true,
  createdAt: true,
  updatedAt: true,
});

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    configurationId: z.string().optional(),
    customConfiguration: z.record(z.any()).optional(),
    quantity: z.number().min(1).default(1),
  })),
  shippingAddressId: z.string(),
  billingAddressId: z.string().optional(),
  discountCode: z.string().optional(),
  paymentMethod: z.enum(["stripe", "paypal"]),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1),
});

export const createWishlistItemSchema = z.object({
  productId: z.string(),
  configurationId: z.string().optional(),
  notes: z.string().optional(),
});

export const applyDiscountSchema = z.object({
  code: z.string(),
  subtotal: z.number(),
});

// Order Management Types
export type Address = typeof addresses.$inferSelect;
export type CreateAddressRequest = z.infer<typeof createAddressSchema>;
export type UpdateAddressRequest = z.infer<typeof updateAddressSchema>;

export type DiscountCode = typeof discountCodes.$inferSelect;
export type CreateDiscountCodeRequest = z.infer<typeof createDiscountCodeSchema>;

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type Refund = typeof refunds.$inferSelect;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type CancelOrderRequest = z.infer<typeof cancelOrderSchema>;

export type WishlistItem = typeof wishlist.$inferSelect;
export type CreateWishlistItemRequest = z.infer<typeof createWishlistItemSchema>;

export type ApplyDiscountRequest = z.infer<typeof applyDiscountSchema>;
