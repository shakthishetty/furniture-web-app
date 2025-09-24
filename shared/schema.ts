import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user role enum
export const userRoleEnum = pgEnum("user_role", ["customer", "manufacturer", "admin"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  username: varchar("username").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  googleId: varchar("google_id").unique(),
  profileImage: varchar("profile_image"),
  isAdmin: boolean("is_admin").default(false), // kept for backward compatibility
  role: userRoleEnum("role").default("customer"), // new role field for three-portal system
  status: varchar("status").default("active"), // active, inactive, suspended, pending_approval
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Manufacturer Profiles Table
export const manufacturerProfiles = pgTable("manufacturer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(), // Foreign key to users table
  companyName: varchar("company_name").notNull(),
  companyAddress: text("company_address").notNull(),
  phone: varchar("phone").notNull(),
  experience: text("experience").notNull(),
  specialties: text("specialties").notNull(), // JSON array of specialties
  portfolioUrls: text("portfolio_urls"), // JSON array of portfolio URLs
  businessLicense: varchar("business_license"),
  certifications: text("certifications"), // JSON array of certifications
  isApproved: boolean("is_approved").default(false),
  approvedBy: varchar("approved_by"), // Admin user ID who approved
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by"), // Admin user ID who rejected
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"), // Admin notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Simple Manufacturers Table (for direct admin creation)
export const manufacturers = pgTable("manufacturers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  description: text("description"),
  photoUrl: varchar("photo_url"), // URL to uploaded photo
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by"), // Admin user ID who created
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
  role: true,
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
  role: z.enum(["customer", "manufacturer", "admin"]).default("customer"),
});

// Manufacturer Registration Schema
export const manufacturerApplicationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
  companyAddress: z.string().min(1),
  phone: z.string().min(1),
  experience: z.string().min(10), // Years of experience
  specialties: z.array(z.string()).min(1), // Areas of expertise
  portfolioUrls: z.array(z.string().url()).optional(),
  businessLicense: z.string().optional(), // Business license number
  certifications: z.array(z.string()).optional(),
  notes: z.string().optional(),
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

// Categories Schema
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  parentId: varchar("parent_id"), // for hierarchical categories
  slug: varchar("slug").notNull().unique(),
  imageUrl: varchar("image_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Configurator Schema
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id"), // foreign key to categories (nullable for backward compatibility)
  category: varchar("category").notNull(), // keep existing for backward compatibility
  basePrice: varchar("base_price").notNull(), // stored as string to avoid float precision issues
  isCustomizable: boolean("is_customizable").default(true),
  status: varchar("status").default("active"), // active, inactive, discontinued
  imageUrl: varchar("image_url"),
  model3dUrl: varchar("model_3d_url"), // URL to 3D model file
  pdfUrl: varchar("pdf_url"), // URL to PDF documentation/catalog
  additionalImages: text("additional_images"), // JSON array of additional image URLs
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

// Category Schemas
export const createCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCategorySchema = createCategorySchema.partial();

// Types
export type Category = typeof categories.$inferSelect;
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;
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

// Admin-specific tables
export const shipments = pgTable("shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  carrier: varchar("carrier").notNull(), // "FedEx", "UPS", "USPS", etc.
  trackingNumber: varchar("tracking_number").notNull(),
  status: varchar("status").default("processing"), // processing, shipped, in_transit, delivered, exception
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  events: text("events"), // JSON array of tracking events
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adminAuditLog = pgTable("admin_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminUserId: varchar("admin_user_id").notNull(),
  action: varchar("action").notNull(), // "create", "update", "delete", "status_change"
  resourceType: varchar("resource_type").notNull(), // "user", "product", "order", "discount"
  resourceId: varchar("resource_id").notNull(),
  oldValues: text("old_values"), // JSON of previous values
  newValues: text("new_values"), // JSON of new values
  metadata: text("metadata"), // JSON of additional context
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
  paymentMethod: z.enum(["stripe", "paypal", "dummy_payment"]),
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

// Admin Types
export type Shipment = typeof shipments.$inferSelect;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;

// Admin Schemas
export const createShipmentSchema = createInsertSchema(shipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateShipmentSchema = createShipmentSchema.partial();

export const adminUpdateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  role: z.enum(["customer", "manufacturer", "admin"]).optional(),
  status: z.enum(["active", "inactive", "suspended", "pending_approval"]).optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Manufacturer Profile Schema
export const manufacturerProfileSchema = z.object({
  companyName: z.string().min(1),
  companyAddress: z.string().min(1),
  phone: z.string().min(1),
  experience: z.string().min(1),
  specialties: z.array(z.string()),
  portfolioUrls: z.array(z.string().url()).optional(),
  businessLicense: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  isApproved: z.boolean().default(false),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type CreateShipmentRequest = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentRequest = z.infer<typeof updateShipmentSchema>;
export type AdminUpdateUserRequest = z.infer<typeof adminUpdateUserSchema>;
export type ManufacturerApplicationRequest = z.infer<typeof manufacturerApplicationSchema>;
export type ManufacturerProfileRequest = z.infer<typeof manufacturerProfileSchema>;
export type ManufacturerProfile = typeof manufacturerProfiles.$inferSelect;

// Create and update schemas for manufacturer profiles
export const createManufacturerProfileSchema = createInsertSchema(manufacturerProfiles).omit({
  id: true,
  userId: true,
  isApproved: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export const approveManufacturerSchema = z.object({
  notes: z.string().optional(),
});

export const rejectManufacturerSchema = z.object({
  reason: z.string().min(1),
  notes: z.string().optional(),
});

export type CreateManufacturerProfileRequest = z.infer<typeof createManufacturerProfileSchema>;
export type ApproveManufacturerRequest = z.infer<typeof approveManufacturerSchema>;
export type RejectManufacturerRequest = z.infer<typeof rejectManufacturerSchema>;

// Manufacturing Tracking Schema
export const manufacturingProcesses = pgTable("manufacturing_processes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, in_progress, paused, completed, canceled
  currentStageId: varchar("current_stage_id"),
  assignedManufacturerId: varchar("assigned_manufacturer_id"), // optional reference to manufacturer user
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const manufacturingStages = pgTable("manufacturing_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processId: varchar("process_id").notNull(),
  name: varchar("name").notNull(), // Wood Cutting, Assembly, Finishing, Quality Check, Packaging
  status: varchar("status").notNull().default("pending"), // pending, in_progress, awaiting_approval, completed, rejected
  position: integer("position").notNull(), // Order of stages (1-4)
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration_hours"),
  notes: text("notes"),
  assignedToUserId: varchar("assigned_to_user_id"),
  // Approval workflow fields
  submittedAt: timestamp("submitted_at"),
  submittedBy: varchar("submitted_by"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  approvalComment: text("approval_comment"),
  rejectedAt: timestamp("rejected_at"),
  rejectedBy: varchar("rejected_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stageUpdates = pgTable("stage_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stageId: varchar("stage_id").notNull(),
  authorUserId: varchar("author_user_id").notNull(),
  authorRole: varchar("author_role").notNull(), // admin, customer
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false), // Internal notes not visible to customers
  createdAt: timestamp("created_at").defaultNow(),
});

export const stageUpdatePhotos = pgTable("stage_update_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  updateId: varchar("update_id").notNull(),
  url: varchar("url").notNull(),
  filename: varchar("filename"),
  width: integer("width"),
  height: integer("height"),
  blurhash: varchar("blurhash"), // For progressive image loading
  createdAt: timestamp("created_at").defaultNow(),
});

export const stageUpdateReplies = pgTable("stage_update_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  updateId: varchar("update_id").notNull(),
  authorUserId: varchar("author_user_id").notNull(),
  authorRole: varchar("author_role").notNull(), // admin, customer
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manufacturing Types
export type ManufacturingProcess = typeof manufacturingProcesses.$inferSelect;
export type ManufacturingStage = typeof manufacturingStages.$inferSelect;
export type StageUpdate = typeof stageUpdates.$inferSelect;
export type StageUpdatePhoto = typeof stageUpdatePhotos.$inferSelect;
export type StageUpdateReply = typeof stageUpdateReplies.$inferSelect;

// Manufacturing Schemas  
export const createManufacturingProcessSchema = createInsertSchema(manufacturingProcesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateManufacturingProcessSchema = createManufacturingProcessSchema.partial();

export const createManufacturingStageSchema = createInsertSchema(manufacturingStages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateManufacturingStageSchema = createManufacturingStageSchema.partial();

export const createStageUpdateSchema = createInsertSchema(stageUpdates).omit({
  id: true,
  createdAt: true,
}).extend({
  photos: z.array(z.union([
    z.string().url(), 
    z.string().trim().regex(/^\/(uploads|assets)\//, { message: "Must be a URL or /uploads path" })
  ])).optional(), // Photo URLs or file paths array
});

export const createStageUpdateReplySchema = createInsertSchema(stageUpdateReplies).omit({
  id: true,
  createdAt: true,
});

export const manufacturingStatusUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "paused", "completed", "canceled"]),
  currentStageId: z.string().optional(),
  notes: z.string().optional(),
  estimatedCompletionDate: z.string().datetime().optional(),
});

export const stageStatusUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "awaiting_approval", "completed", "rejected"]),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  assignedToUserId: z.string().optional(),
});

// New schemas for approval workflow
export const stageSubmissionSchema = z.object({
  message: z.string().min(10, "Submission message must be at least 10 characters"),
});

export const stageApprovalSchema = z.object({
  comment: z.string().optional(),
});

export const stageRejectionSchema = z.object({
  reason: z.string().min(5, "Rejection reason is required"),
});

export const manufacturerAssignmentSchema = z.object({
  manufacturerId: z.string().nullable(),
});

// Manufacturing Request Types
export type CreateManufacturingProcessRequest = z.infer<typeof createManufacturingProcessSchema>;
export type UpdateManufacturingProcessRequest = z.infer<typeof updateManufacturingProcessSchema>;
export type CreateManufacturingStageRequest = z.infer<typeof createManufacturingStageSchema>;
export type UpdateManufacturingStageRequest = z.infer<typeof updateManufacturingStageSchema>;
export type CreateStageUpdateRequest = z.infer<typeof createStageUpdateSchema>;
export type CreateStageUpdateReplyRequest = z.infer<typeof createStageUpdateReplySchema>;
export type ManufacturingStatusUpdateRequest = z.infer<typeof manufacturingStatusUpdateSchema>;
export type StageStatusUpdateRequest = z.infer<typeof stageStatusUpdateSchema>;
export type ManufacturerAssignmentRequest = z.infer<typeof manufacturerAssignmentSchema>;

// Approval workflow types
export type StageSubmissionRequest = z.infer<typeof stageSubmissionSchema>;
export type StageApprovalRequest = z.infer<typeof stageApprovalSchema>;
export type StageRejectionRequest = z.infer<typeof stageRejectionSchema>;

// Simple Manufacturer Schemas (for direct admin creation)
export const createManufacturerSchema = createInsertSchema(manufacturers).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const updateManufacturerSchema = createManufacturerSchema.partial();

// Simple Manufacturer Types
export type Manufacturer = typeof manufacturers.$inferSelect;
export type CreateManufacturerRequest = z.infer<typeof createManufacturerSchema>;
export type UpdateManufacturerRequest = z.infer<typeof updateManufacturerSchema>;
