import express from "express";
import { storage } from "./storage";
import { requireAdmin, verifyAuth } from "./utils/auth";
import { adminUpdateUserSchema, type AdminUpdateUserRequest, createDiscountSchema, updateDiscountSchema, type CreateDiscountRequest, type UpdateDiscountRequest, createCategorySchema, updateCategorySchema, type CreateCategoryRequest, type UpdateCategoryRequest, createManufacturingProcessSchema, updateManufacturingProcessSchema, createManufacturingStageSchema, updateManufacturingStageSchema, createStageUpdateSchema, createStageUpdateReplySchema, manufacturingStatusUpdateSchema, stageStatusUpdateSchema, manufacturerAssignmentSchema, stageApprovalSchema, stageRejectionSchema, type CreateManufacturingProcessRequest, type UpdateManufacturingProcessRequest, type CreateManufacturingStageRequest, type UpdateManufacturingStageRequest, type CreateStageUpdateRequest, type CreateStageUpdateReplyRequest, type ManufacturingStatusUpdateRequest, type StageStatusUpdateRequest, type ManufacturerAssignmentRequest, materials, productMaterials } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";
import { sendStageUpdateEmail } from "./utils/email";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { calculateProductStatus, type ProductMaterialCounts } from "./utils/product-status";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Validation schemas for admin operations
const orderStatusUpdateSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "canceled"]),
  comment: z.string().optional()
});

// Note: adminDiscountUpdateSchema removed - using updateDiscountSchema from shared/schema.ts instead
// Note: stageApprovalSchema and stageRejectionSchema imported from shared/schema.ts

// Helper to validate URLs, object storage paths, and local upload paths
const urlOrPathSchema = z.string().refine(
  (val) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/objects/') || val.startsWith('/uploads/'),
  "Must be a valid URL, object storage path, or upload path"
);

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category ID is required"),
  // Accept both basePrice (string) and price (number) from frontend
  basePrice: z.string().refine(val => parseFloat(val) >= 0, "Price must be a positive number").optional(),
  price: z.number().min(0).optional(), // Frontend compatibility
  // Accept both draft and other statuses, map draft to inactive
  status: z.enum(["active", "inactive", "out_of_stock", "draft"]).default("inactive"),
  imageUrl: urlOrPathSchema.optional(),
  // Accept both model3dUrl and modelUrl from frontend
  model3dUrl: urlOrPathSchema.optional(),
  modelUrl: urlOrPathSchema.optional(), // Frontend compatibility
  pdfUrl: urlOrPathSchema.optional(),
  // Accept both string and array for additionalImages
  additionalImages: z.union([z.string(), z.array(z.string())]).optional(),
  inStock: z.boolean().default(true),
  stock: z.number().int().min(0).default(0)
});

const adminProductUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  // Accept both basePrice and price
  basePrice: z.string().refine(val => !val || (parseFloat(val) >= 0), "Base price must be positive").optional(),
  price: z.number().min(0).optional(),
  // Accept draft status
  status: z.enum(["active", "inactive", "out_of_stock", "draft"]).optional(),
  imageUrl: urlOrPathSchema.optional().nullable(),
  // Accept both model field names
  model3dUrl: urlOrPathSchema.optional().nullable(),
  modelUrl: urlOrPathSchema.optional().nullable(),
  pdfUrl: urlOrPathSchema.optional().nullable(),
  // Accept both string and array
  additionalImages: z.union([z.string(), z.array(z.string())]).optional(),
  inStock: z.boolean().optional(),
  stock: z.number().int().min(0).optional()
});

const router = express.Router();

// Helper function to get material counts for a product
async function getProductMaterialCounts(productId: string): Promise<ProductMaterialCounts> {
  const productMaterialsList = await db
    .select({
      subType: materials.subType,
    })
    .from(productMaterials)
    .innerJoin(materials, eq(productMaterials.materialId, materials.id))
    .where(eq(productMaterials.productId, productId));

  const counts: ProductMaterialCounts = {
    woodTypes: 0,
    woodStains: 0,
    upholstery: 0,
    hardwareFinish: 0,
    surfaceFinish: 0,
  };

  productMaterialsList.forEach(item => {
    const subType = item.subType;
    if (subType === 'wood-type') counts.woodTypes++;
    else if (subType === 'wood-stain') counts.woodStains++;
    else if (subType === 'upholstery') counts.upholstery++;
    else if (subType === 'hardware-finish' || subType === 'hardware') counts.hardwareFinish++;
    else if (subType === 'surface-finish') counts.surfaceFinish++;
  });

  return counts;
}

// Admin Authentication Routes
router.get("/auth/me", verifyAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user from database to check admin status
    const user = await storage.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin || false,
      status: user.status,
    });
  } catch (error) {
    console.error("Error getting admin user:", error);
    res.status(500).json({ error: "Failed to get user information" });
  }
});

// Admin User Management Routes
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const users = await storage.getUsers({ page, limit, search, status });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:id", requireAdmin, async (req, res) => {
  try {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't include sensitive fields
    const { password, passwordResetToken, emailVerificationToken, ...userWithoutSensitiveData } = user;
    res.json(userWithoutSensitiveData);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.patch("/users/:id", requireAdmin, async (req, res) => {
  try {
    const validation = adminUpdateUserSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid data",
        details: validation.error.errors,
      });
    }

    const updatedUser = await storage.updateUser(req.params.id, validation.data);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log admin action
    console.log(`Admin ${req.user?.userId} updated user ${req.params.id}:`, validation.data);

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Delete user request for ID: ${userId}`);
    
    // Check if user exists
    const user = await storage.getUserById(userId);
    if (!user) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deletion of current admin user
    if (req.user?.userId === userId) {
      console.log(`Admin tried to delete own account: ${userId}`);
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    console.log(`Attempting to delete user: ${user.email}`);
    const deleted = await storage.deleteUser(userId);
    console.log(`Delete result: ${deleted}`);
    
    if (!deleted) {
      console.log(`Failed to delete user: ${userId}`);
      return res.status(500).json({ error: "Failed to delete user" });
    }

    // Log admin action
    console.log(`Admin ${req.user?.userId} deleted user ${userId}: ${user.email}`);

    const response = { success: true, message: "User deleted successfully" };
    console.log(`Sending response:`, response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "Failed to delete user", details: errorMessage });
  }
});

// Get manufacturers for assignment dropdown
router.get("/users/manufacturers", requireAdmin, async (req, res) => {
  try {
    const manufacturers = await storage.getManufacturers();
    const manufacturersResponse = manufacturers.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status
    }));
    
    res.json(manufacturersResponse);
  } catch (error) {
    console.error("Error fetching manufacturers:", error);
    res.status(500).json({ error: "Failed to fetch manufacturers" });
  }
});

// Admin Product Management Routes
router.get("/products", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const status = req.query.status as string;

    const result = await storage.getProducts({ page, limit, category, status });
    
    // Helper function to safely parse additionalImages
    const parseAdditionalImages = (additionalImages: any) => {
      if (!additionalImages) return [];
      if (Array.isArray(additionalImages)) return additionalImages;
      if (typeof additionalImages === 'string') {
        try {
          return JSON.parse(additionalImages);
        } catch (error) {
          console.error('Error parsing additionalImages JSON:', error);
          return [];
        }
      }
      return [];
    };

    // Transform products with calculated status and completion
    const transformedProducts = await Promise.all(
      result.products.map(async (product) => {
        // Get material counts for this product
        const materialCounts = await getProductMaterialCounts(product.id);
        
        // Calculate status and completion
        const statusResult = calculateProductStatus(
          {
            status: product.status || undefined,
            stock: product.stock !== null && product.stock !== undefined ? product.stock : undefined,
            inStock: product.inStock !== null && product.inStock !== undefined ? product.inStock : undefined,
            category: product.category || undefined,
          },
          materialCounts
        );

        return {
          ...product,
          // Convert basePrice string to price number for frontend
          price: product.basePrice ? parseFloat(product.basePrice) : 0,
          // Parse additionalImages JSON string to array with error handling
          additionalImages: parseAdditionalImages(product.additionalImages),
          // Keep basePrice for API compatibility
          basePrice: product.basePrice,
          // Add computed status and completion data
          computedStatus: statusResult.computedStatus,
          completionPercentage: statusResult.completionPercentage,
          missingSetup: statusResult.missingSetup,
          materialCounts,
        };
      })
    );

    res.json({
      ...result,
      products: transformedProducts
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/products", requireAdmin, async (req, res) => {
  try {
    const validation = createProductSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid product data", details: validation.error.flatten() });
    }

    // Get category slug from categoryId for backward compatibility
    let categorySlug = '';
    if (validation.data.categoryId) {
      try {
        const category = await storage.getCategoryById(validation.data.categoryId);
        categorySlug = category?.slug || '';
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    }

    // Transform frontend data to match backend schema
    const productData: any = {
      name: validation.data.name,
      description: validation.data.description,
      categoryId: validation.data.categoryId,
      category: categorySlug,
      // Handle price field - accept both basePrice and price
      basePrice: validation.data.basePrice || 
                 (validation.data.price ? validation.data.price.toString() : undefined),
      // Map status: convert "draft" to "inactive" for backend
      status: validation.data.status === 'draft' ? 'inactive' : validation.data.status,
      // Handle file URLs
      imageUrl: validation.data.imageUrl,
      // Map both modelUrl and model3dUrl
      model3dUrl: validation.data.model3dUrl || validation.data.modelUrl,
      pdfUrl: validation.data.pdfUrl,
      // Handle additionalImages - convert array to JSON string if needed
      additionalImages: validation.data.additionalImages ? 
        (Array.isArray(validation.data.additionalImages) ? 
          JSON.stringify(validation.data.additionalImages) : 
          validation.data.additionalImages) : 
        undefined,
      inStock: validation.data.inStock,
      stock: validation.data.stock
    };
    
    // Remove undefined values
    Object.keys(productData).forEach(key => {
      if (productData[key] === undefined) {
        delete productData[key];
      }
    });

    const newProduct = await storage.createProduct(productData);
    console.log(`Admin ${req.user?.userId} created product ${newProduct.id}:`, productData);
    
    // Transform created product for frontend compatibility
    const transformedProduct = {
      ...newProduct,
      // Convert basePrice string to price number for frontend
      price: newProduct.basePrice ? parseFloat(newProduct.basePrice) : 0,
      // Parse additionalImages JSON string to array with error handling
      additionalImages: (() => {
        if (!newProduct.additionalImages) return [];
        if (Array.isArray(newProduct.additionalImages)) return newProduct.additionalImages;
        if (typeof newProduct.additionalImages === 'string') {
          try {
            return JSON.parse(newProduct.additionalImages);
          } catch (error) {
            console.error('Error parsing additionalImages JSON:', error);
            return [];
          }
        }
        return [];
      })()
    };
    
    res.status(201).json(transformedProduct);
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Error && error.message?.includes("unique constraint")) {
      return res.status(409).json({ error: "Product name already exists" });
    }
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.patch("/products/:id", requireAdmin, async (req, res) => {
  try {
    const validation = adminProductUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid product data", details: validation.error.flatten() });
    }

    // Transform update data to match backend schema
    const updateData: any = {};
    
    // Copy basic fields
    if (validation.data.name !== undefined) updateData.name = validation.data.name;
    if (validation.data.description !== undefined) updateData.description = validation.data.description;
    if (validation.data.categoryId !== undefined) updateData.categoryId = validation.data.categoryId;
    if (validation.data.inStock !== undefined) updateData.inStock = validation.data.inStock;
    if (validation.data.stock !== undefined) updateData.stock = validation.data.stock;
    
    // Handle price fields
    if (validation.data.basePrice !== undefined) {
      updateData.basePrice = validation.data.basePrice;
    } else if (validation.data.price !== undefined) {
      updateData.basePrice = validation.data.price.toString();
    }
    
    // Handle status mapping
    if (validation.data.status !== undefined) {
      updateData.status = validation.data.status === 'draft' ? 'inactive' : validation.data.status;
    }
    
    // Handle file URLs
    if (validation.data.imageUrl !== undefined) updateData.imageUrl = validation.data.imageUrl;
    if (validation.data.pdfUrl !== undefined) updateData.pdfUrl = validation.data.pdfUrl;
    
    // Handle model URL mapping
    if (validation.data.model3dUrl !== undefined) {
      updateData.model3dUrl = validation.data.model3dUrl;
    } else if (validation.data.modelUrl !== undefined) {
      updateData.model3dUrl = validation.data.modelUrl;
    }
    
    // Handle additionalImages
    if (validation.data.additionalImages !== undefined) {
      updateData.additionalImages = Array.isArray(validation.data.additionalImages) ? 
        JSON.stringify(validation.data.additionalImages) : 
        validation.data.additionalImages;
    }
    
    // Handle category slug derivation if categoryId changed
    if (validation.data.categoryId) {
      try {
        const category = await storage.getCategoryById(validation.data.categoryId);
        if (category) updateData.category = category.slug;
      } catch (error) {
        console.error('Error fetching category for update:', error);
      }
    }

    const updatedProduct = await storage.updateProduct(req.params.id, updateData);
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(`Admin ${req.user?.userId} updated product ${req.params.id}:`, updateData);
    
    // Transform updated product for frontend compatibility
    const transformedProduct = {
      ...updatedProduct,
      // Convert basePrice string to price number for frontend
      price: updatedProduct.basePrice ? parseFloat(updatedProduct.basePrice) : 0,
      // Parse additionalImages JSON string to array with error handling
      additionalImages: (() => {
        if (!updatedProduct.additionalImages) return [];
        if (Array.isArray(updatedProduct.additionalImages)) return updatedProduct.additionalImages;
        if (typeof updatedProduct.additionalImages === 'string') {
          try {
            return JSON.parse(updatedProduct.additionalImages);
          } catch (error) {
            console.error('Error parsing additionalImages JSON:', error);
            return [];
          }
        }
        return [];
      })()
    };
    
    res.json(transformedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product route
router.delete("/products/:id", requireAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Check if product exists first
    const existingProduct = await storage.getProduct(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    const success = await storage.deleteProduct(productId);
    
    if (success) {
      console.log(`Admin ${req.user?.userId} deleted product ${productId}: ${existingProduct.name}`);
      res.json({ success: true, message: "Product deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete product" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Admin Order Management Routes
router.get("/orders", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const orders = await storage.getOrdersForAdmin({ 
      page, 
      limit, 
      status, 
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined 
    });
    
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const validation = orderStatusUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid status or comment", details: validation.error.flatten() });
    }

    const { status, comment } = validation.data;
    const updatedOrder = await storage.updateOrderStatus(req.params.id, status, comment);
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`Admin ${req.user?.userId} updated order ${req.params.id} status to ${status}`);
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Admin Analytics Routes
router.get("/analytics/summary", requireAdmin, async (req, res) => {
  try {
    const analytics = await storage.getAnalyticsSummary();
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/analytics/orders-by-day", requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await storage.getOrdersByDay(days);
    res.json(data);
  } catch (error) {
    console.error("Error fetching orders by day:", error);
    res.status(500).json({ error: "Failed to fetch orders by day" });
  }
});

// Admin Discount Code Management Routes
router.get("/discounts", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Cap at 100
    
    const discounts = await storage.getDiscounts({ page, limit });
    res.json(discounts);
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    res.status(500).json({ error: "Failed to fetch discount codes" });
  }
});

router.get("/discounts/:id", requireAdmin, async (req, res) => {
  try {
    const discount = await storage.getDiscountById(req.params.id);
    if (!discount) {
      return res.status(404).json({ error: "Discount code not found" });
    }
    res.json(discount);
  } catch (error) {
    console.error("Error fetching discount code:", error);
    res.status(500).json({ error: "Failed to fetch discount code" });
  }
});

router.post("/discounts", requireAdmin, async (req, res) => {
  try {
    const validation = createDiscountSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid discount data", details: validation.error.flatten() });
    }

    const discount = await storage.createDiscount(validation.data);
    console.log(`Admin ${req.user?.userId} created discount code ${discount.discountCode}`);
    res.status(201).json(discount);
  } catch (error) {
    console.error("Error creating discount code:", error);
    res.status(500).json({ error: "Failed to create discount code" });
  }
});

router.patch("/discounts/:id", requireAdmin, async (req, res) => {
  try {
    const validation = updateDiscountSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid update data", details: validation.error.flatten() });
    }

    const updatedDiscount = await storage.updateDiscount(req.params.id, validation.data);
    if (!updatedDiscount) {
      return res.status(404).json({ error: "Discount code not found" });
    }

    console.log(`Admin ${req.user?.userId} updated discount code ${req.params.id}`);
    res.json(updatedDiscount);
  } catch (error) {
    console.error("Error updating discount code:", error);
    res.status(500).json({ error: "Failed to update discount code" });
  }
});

router.delete("/discounts/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await storage.deleteDiscount(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Discount code not found" });
    }

    console.log(`Admin ${req.user?.userId} deleted discount code ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting discount code:", error);
    res.status(500).json({ error: "Failed to delete discount code" });
  }
});

// Admin Category Management Routes
router.get("/categories", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Cap at 100
    
    const categories = await storage.getCategories({ page, limit });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const category = await storage.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

router.post("/categories", requireAdmin, async (req, res) => {
  try {
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid category data", details: validation.error.flatten() });
    }

    const category = await storage.createCategory(validation.data);
    console.log(`Admin ${req.user?.userId} created category ${category.name}`);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof Error && error.message?.includes("unique constraint")) {
      return res.status(409).json({ error: "Category name or slug already exists" });
    }
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/categories/:id", requireAdmin, async (req, res) => {
  try {
    const validation = updateCategorySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid update data", details: validation.error.flatten() });
    }

    const updatedCategory = await storage.updateCategory(req.params.id, validation.data);
    if (!updatedCategory) {
      return res.status(404).json({ error: "Category not found" });
    }

    console.log(`Admin ${req.user?.userId} updated category ${req.params.id}`);
    res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error instanceof Error && error.message?.includes("unique constraint")) {
      return res.status(409).json({ error: "Category name or slug already exists" });
    }
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/categories/:id", requireAdmin, async (req, res) => {
  try {
    // Check if category is being used by any products
    const productsInCategory = await storage.getProductsByCategoryId(req.params.id);
    if (productsInCategory && productsInCategory.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete category with associated products",
        productCount: productsInCategory.length
      });
    }

    const deleted = await storage.deleteCategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Category not found" });
    }

    console.log(`Admin ${req.user?.userId} deleted category ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// ====================================
// File Upload Routes (Local Development)
// ====================================

// Setup uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Simple file upload endpoint - handle raw file data like Replit system
router.post("/objects/upload", requireAdmin, express.raw({limit: '50mb', type: '*/*'}), async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const originalName = req.headers['x-original-name'] as string || 'unnamed';
    
    console.log('Upload attempt:', {
      contentType,
      originalName,
      bodySize: req.body?.length
    });
    
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
    const ext = path.extname(originalName);
    const filename = `${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    
    // More flexible file type validation based on both content type and file extension
    const isImage = contentType.startsWith('image/') || /\\.(jpg|jpeg|png|gif|webp)$/i.test(originalName);
    const isPDF = contentType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');
    const is3DModel = contentType.includes('gltf') || originalName.toLowerCase().endsWith('.glb') || 
                     (contentType === 'application/octet-stream' && originalName.toLowerCase().endsWith('.glb'));
    
    const isValidType = isImage || isPDF || is3DModel;
    
    if (!isValidType) {
      console.log('File rejected:', { contentType, originalName, isImage, isPDF, is3DModel });
      return res.status(400).json({ error: 'Invalid file type. Only images, PDFs, and 3D models (GLB) are allowed.' });
    }

    // Write file to disk
    fs.writeFileSync(filePath, req.body);
    
    const publicPath = `/uploads/${filename}`;
    
    console.log(`Admin ${req.user?.userId} uploaded file: ${originalName} -> ${publicPath}`);
    
    res.json({
      success: true,
      path: publicPath,
      originalName,
      size: req.body.length,
      mimetype: contentType
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// Legacy compatibility routes (for existing frontend that might still call these)
router.post("/objects/upload-url", requireAdmin, async (req, res) => {
  // For local development, return a direct upload endpoint
  res.json({
    method: "POST",
    url: "/api/admin/objects/upload",
    useDirectUpload: true
  });
});

router.post("/objects/finalize", requireAdmin, async (req, res) => {
  // For local development, files are immediately available after upload
  const { path } = req.body;
  res.json({ path });
});

// ====================================
// Manufacturer Management Admin Routes
// ====================================

// Get pending manufacturer applications
router.get("/manufacturers/pending", requireAdmin, async (req, res) => {
  try {
    const applications = await storage.getPendingManufacturerApplications();
    res.json(applications);
  } catch (error) {
    console.error("Error fetching pending manufacturer applications:", error);
    res.status(500).json({ error: "Failed to fetch pending applications" });
  }
});

// Get approved manufacturers
router.get("/manufacturers/approved", requireAdmin, async (req, res) => {
  try {
    const manufacturers = await storage.getApprovedManufacturers();
    res.json(manufacturers);
  } catch (error) {
    console.error("Error fetching approved manufacturers:", error);
    res.status(500).json({ error: "Failed to fetch approved manufacturers" });
  }
});

// Get manufacturer profile details by ID
router.get("/manufacturers/:id", requireAdmin, async (req, res) => {
  try {
    const profile = await storage.getManufacturerProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "Manufacturer profile not found" });
    }
    res.json(profile);
  } catch (error) {
    console.error("Error fetching manufacturer profile:", error);
    res.status(500).json({ error: "Failed to fetch manufacturer profile" });
  }
});

// Approve manufacturer application
router.patch("/manufacturers/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { notes } = req.body;
    const adminUserId = req.user!.userId;
    
    const approvedProfile = await storage.approveManufacturer(req.params.id, adminUserId, notes);
    if (!approvedProfile) {
      return res.status(404).json({ error: "Manufacturer profile not found" });
    }
    
    console.log(`Admin ${adminUserId} approved manufacturer profile ${req.params.id}`);
    res.json({ 
      message: "Manufacturer approved successfully",
      profile: approvedProfile 
    });
  } catch (error) {
    console.error("Error approving manufacturer:", error);
    res.status(500).json({ error: "Failed to approve manufacturer" });
  }
});

// Reject manufacturer application
router.patch("/manufacturers/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { reason, notes } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }
    
    const adminUserId = req.user!.userId;
    
    const rejectedProfile = await storage.rejectManufacturer(req.params.id, adminUserId, reason, notes);
    if (!rejectedProfile) {
      return res.status(404).json({ error: "Manufacturer profile not found" });
    }
    
    console.log(`Admin ${adminUserId} rejected manufacturer profile ${req.params.id}`);
    res.json({ 
      message: "Manufacturer application rejected",
      profile: rejectedProfile 
    });
  } catch (error) {
    console.error("Error rejecting manufacturer:", error);
    res.status(500).json({ error: "Failed to reject manufacturer application" });
  }
});

// ====================================
// Manufacturing Tracking Admin Routes
// ====================================

// Manufacturing Processes Routes
router.get("/manufacturing/processes", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const orderId = req.query.orderId as string;
    const manufacturerId = req.query.manufacturerId as string;

    const result = await storage.getManufacturingProcesses({ page, limit, status, orderId, manufacturerId });
    
    // Calculate totalStages and completedStages for each process
    const processesWithProgress = await Promise.all(
      result.processes.map(async (process) => {
        const stages = await storage.getManufacturingStages(process.id);
        const completedCount = stages.filter(s => s.status === 'completed').length;
        return {
          ...process,
          totalStages: stages.length,
          completedStages: completedCount
        };
      })
    );
    
    res.json({
      ...result,
      processes: processesWithProgress
    });
  } catch (error) {
    console.error("Error fetching manufacturing processes:", error);
    res.status(500).json({ error: "Failed to fetch manufacturing processes" });
  }
});

router.get("/manufacturing/processes/:id", requireAdmin, async (req, res) => {
  try {
    const process = await storage.getManufacturingProcessWithDetails(req.params.id);
    if (!process) {
      return res.status(404).json({ error: "Manufacturing process not found" });
    }
    res.json(process);
  } catch (error) {
    console.error("Error fetching manufacturing process:", error);
    res.status(500).json({ error: "Failed to fetch manufacturing process" });
  }
});

router.post("/manufacturing/processes", requireAdmin, async (req, res) => {
  try {
    const validatedData = createManufacturingProcessSchema.parse(req.body);
    
    // Strip any # prefix from orderId to ensure clean database references
    if (validatedData.orderId.startsWith('#')) {
      validatedData.orderId = validatedData.orderId.substring(1);
    }
    
    const process = await storage.createManufacturingProcess(validatedData);
    
    console.log(`Admin ${req.user?.userId} created manufacturing process ${process.id} for order ${process.orderId}`);
    res.status(201).json(process);
  } catch (error) {
    console.error("Error creating manufacturing process:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create manufacturing process" });
  }
});

// Assign manufacturer to process
router.post("/manufacturing/processes/:id/assign", requireAdmin, async (req, res) => {
  try {
    const validation = manufacturerAssignmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid assignment data",
        details: validation.error.errors,
      });
    }

    const { manufacturerId } = validation.data;

    // Validate direct manufacturer exists and is active if not null
    if (manufacturerId) {
      const manufacturer = await storage.getDirectManufacturer(manufacturerId);
      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" });
      }
      if (!manufacturer.isActive) {
        return res.status(400).json({ error: "Manufacturer is not active" });
      }
    }

    const updatedProcess = await storage.assignManufacturerToProcess(req.params.id, manufacturerId);
    if (!updatedProcess) {
      return res.status(404).json({ error: "Manufacturing process not found" });
    }

    // Create notification for manufacturer if assigned (not unassigned)
    if (manufacturerId) {
      try {
        // Get order details for notification message
        const order = await storage.getOrder(updatedProcess.orderId);
        const orderItems = await storage.getOrderItems(updatedProcess.orderId);
        
        const productNames = orderItems.map((item: any) => item.productName).join(', ');
        const orderNumber = order?.orderNumber || updatedProcess.orderId;
        
        await storage.createNotification({
          userId: manufacturerId,
          orderId: updatedProcess.orderId,
          processId: updatedProcess.id,
          type: 'new_assignment',
          title: 'New Order Assigned',
          message: `You have been assigned to a new manufacturing order #${orderNumber}. Products: ${productNames}`,
          isRead: false,
        });
        
        console.log(`Created notification for manufacturer ${manufacturerId} for process ${updatedProcess.id}`);
      } catch (notificationError) {
        console.error('Failed to create manufacturer notification:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    // Broadcast assignment change to SSE connections
    if (global.broadcastManufacturingUpdate) {
      global.broadcastManufacturingUpdate(updatedProcess.id, {
        type: 'process_status_change',
        processId: updatedProcess.id,
        orderId: updatedProcess.orderId,
        status: `assigned_to_${manufacturerId || 'unassigned'}`
      });
    }

    console.log(`Admin ${req.user?.userId} assigned process ${req.params.id} to manufacturer ${manufacturerId}`);
    
    // Return process with manufacturer details
    const processWithDetails = await storage.getManufacturingProcessWithManufacturer(req.params.id);
    res.json(processWithDetails);
  } catch (error) {
    console.error("Error assigning manufacturer to process:", error);
    res.status(500).json({ error: "Failed to assign manufacturer to process" });
  }
});

router.patch("/manufacturing/processes/:id", requireAdmin, async (req, res) => {
  try {
    const validatedData = manufacturingStatusUpdateSchema.parse(req.body);
    const process = await storage.updateManufacturingProcess(req.params.id, validatedData);
    
    if (!process) {
      return res.status(404).json({ error: "Manufacturing process not found" });
    }
    
    // Broadcast process status change to SSE connections
    if (global.broadcastProcessStatusChange) {
      global.broadcastProcessStatusChange(process.id, process.status, process.orderId);
    }
    
    console.log(`Admin ${req.user?.userId} updated manufacturing process ${process.id} to status: ${process.status}`);
    res.json(process);
  } catch (error) {
    console.error("Error updating manufacturing process:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update manufacturing process" });
  }
});

router.delete("/manufacturing/processes/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await storage.deleteManufacturingProcess(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Manufacturing process not found" });
    }
    
    console.log(`Admin ${req.user?.userId} deleted manufacturing process ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting manufacturing process:", error);
    res.status(500).json({ error: "Failed to delete manufacturing process" });
  }
});

// Manufacturing Stages Routes
router.get("/manufacturing/processes/:processId/stages", requireAdmin, async (req, res) => {
  try {
    const stages = await storage.getManufacturingStages(req.params.processId);
    res.json(stages);
  } catch (error) {
    console.error("Error fetching manufacturing stages:", error);
    res.status(500).json({ error: "Failed to fetch manufacturing stages" });
  }
});

router.post("/manufacturing/processes/:processId/stages", requireAdmin, async (req, res) => {
  try {
    const validatedData = createManufacturingStageSchema.parse({
      ...req.body,
      processId: req.params.processId
    });
    const stage = await storage.createManufacturingStage(validatedData);
    
    console.log(`Admin ${req.user?.userId} created manufacturing stage ${stage.id} for process ${req.params.processId}`);
    res.status(201).json(stage);
  } catch (error) {
    console.error("Error creating manufacturing stage:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create manufacturing stage" });
  }
});

// Stage Approval Workflow Routes (Must come before /:id routes to avoid collision)
// Get all stages awaiting approval
router.get("/manufacturing/stages/awaiting-approval", requireAdmin, async (req, res) => {
  try {
    const stagesAwaitingApproval = await storage.getStagesAwaitingApproval();
    res.json(stagesAwaitingApproval);
  } catch (error) {
    console.error("Error fetching stages awaiting approval:", error);
    res.status(500).json({ error: "Failed to fetch stages awaiting approval" });
  }
});

router.get("/manufacturing/stages/:id", requireAdmin, async (req, res) => {
  try {
    const stage = await storage.getManufacturingStage(req.params.id);
    if (!stage) {
      return res.status(404).json({ error: "Manufacturing stage not found" });
    }
    res.json(stage);
  } catch (error) {
    console.error("Error fetching manufacturing stage:", error);
    res.status(500).json({ error: "Failed to fetch manufacturing stage" });
  }
});

router.patch("/manufacturing/stages/:id", requireAdmin, async (req, res) => {
  try {
    const validatedData = stageStatusUpdateSchema.parse(req.body);
    const stage = await storage.updateManufacturingStage(req.params.id, validatedData);
    
    if (!stage) {
      return res.status(404).json({ error: "Manufacturing stage not found" });
    }
    
    // Broadcast stage status change to SSE connections
    if (global.broadcastManufacturingUpdate) {
      global.broadcastManufacturingUpdate(stage.processId, {
        type: 'stage_update',
        update: stage
      });
    }
    
    console.log(`Admin ${req.user?.userId} updated manufacturing stage ${stage.id} to status: ${stage.status}`);
    res.json(stage);
  } catch (error) {
    console.error("Error updating manufacturing stage:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update manufacturing stage" });
  }
});

router.delete("/manufacturing/stages/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await storage.deleteManufacturingStage(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Manufacturing stage not found" });
    }
    
    console.log(`Admin ${req.user?.userId} deleted manufacturing stage ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting manufacturing stage:", error);
    res.status(500).json({ error: "Failed to delete manufacturing stage" });
  }
});

// Stage Updates Routes
router.get("/manufacturing/stages/:stageId/updates", requireAdmin, async (req, res) => {
  try {
    const includeInternal = req.query.includeInternal === 'true';
    const updates = await storage.getStageUpdates(req.params.stageId, includeInternal);
    res.json(updates);
  } catch (error) {
    console.error("Error fetching stage updates:", error);
    res.status(500).json({ error: "Failed to fetch stage updates" });
  }
});

router.post("/manufacturing/stages/:stageId/updates", requireAdmin, async (req, res) => {
  try {
    const validatedData = createStageUpdateSchema.parse({
      ...req.body,
      stageId: req.params.stageId,
      authorUserId: req.user?.userId,
      authorRole: "admin"
    });
    
    const update = await storage.createStageUpdate(validatedData);
    
    // Broadcast stage update to SSE connections and send customer notification
    const stage = await storage.getManufacturingStage(req.params.stageId);
    if (stage) {
      if (global.broadcastStageUpdate) {
        global.broadcastStageUpdate(stage.processId, update);
      }
      
      // Create customer notification for admin update (only if not internal)
      if (!update.isInternal) {
        try {
          const process = await storage.getManufacturingProcess(stage.processId);
          if (process) {
            const order = await storage.getOrder(process.orderId);
            if (order) {
              await storage.createNotification({
                userId: order.userId,
                orderId: order.id,
                processId: process.id,
                stageId: stage.id,
                type: 'admin_message',
                title: `Admin Update: ${stage.name}`,
                message: `Administrator posted an update: ${update.message.substring(0, 100)}${update.message.length > 100 ? '...' : ''}`,
                isRead: false
              });
              
              console.log(`Created notification for customer ${order.userId} about admin update ${update.id}`);
            }
          }
        } catch (notificationError) {
          console.error('Failed to create customer notification for admin update:', notificationError);
          // Don't fail the request if notification fails
        }
      }
    }
    
    console.log(`Admin ${req.user?.userId} created stage update ${update.id} for stage ${req.params.stageId}`);
    res.status(201).json(update);
  } catch (error) {
    console.error("Error creating stage update:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create stage update" });
  }
});

router.get("/manufacturing/updates/:updateId", requireAdmin, async (req, res) => {
  try {
    const update = await storage.getStageUpdate(req.params.updateId);
    if (!update) {
      return res.status(404).json({ error: "Stage update not found" });
    }
    res.json(update);
  } catch (error) {
    console.error("Error fetching stage update:", error);
    res.status(500).json({ error: "Failed to fetch stage update" });
  }
});

// Stage Update Replies Routes
router.get("/manufacturing/updates/:updateId/replies", requireAdmin, async (req, res) => {
  try {
    const replies = await storage.getStageUpdateReplies(req.params.updateId);
    res.json(replies);
  } catch (error) {
    console.error("Error fetching stage update replies:", error);
    res.status(500).json({ error: "Failed to fetch stage update replies" });
  }
});

router.post("/manufacturing/updates/:updateId/replies", requireAdmin, async (req, res) => {
  try {
    const validatedData = createStageUpdateReplySchema.parse({
      ...req.body,
      updateId: req.params.updateId,
      authorUserId: req.user?.userId,
      authorRole: "admin"
    });
    
    const reply = await storage.createStageUpdateReply(validatedData);
    
    // Broadcast new reply to SSE connections and send customer notification
    const update = await storage.getStageUpdate(req.params.updateId);
    if (update) {
      const stage = await storage.getManufacturingStage(update.stageId);
      if (stage) {
        if (global.broadcastNewReply) {
          global.broadcastNewReply(stage.processId, reply);
        }
        
        // Only create customer notification if admin is replying to a customer's question
        // Don't notify customer for admin-to-manufacturer communications
        if (update.authorRole === 'customer') {
          try {
            const process = await storage.getManufacturingProcess(stage.processId);
            if (process) {
              const order = await storage.getOrder(process.orderId);
              if (order) {
                await storage.createNotification({
                  userId: order.userId,
                  orderId: order.id,
                  processId: process.id,
                  stageId: stage.id,
                  type: 'admin_message',
                  title: 'Admin Response',
                  message: `Administrator responded: ${reply.message.substring(0, 100)}${reply.message.length > 100 ? '...' : ''}`,
                  isRead: false
                });
                
                console.log(`Created notification for customer ${order.userId} about admin reply ${reply.id}`);
              }
            }
          } catch (notificationError) {
            console.error('Failed to create customer notification for admin reply:', notificationError);
            // Don't fail the request if notification fails
          }
        } else {
          console.log(`Skipped customer notification - admin replying to ${update.authorRole} update`);
        }
      }
    }
    
    console.log(`Admin ${req.user?.userId} created reply ${reply.id} for update ${req.params.updateId}`);
    res.status(201).json(reply);
  } catch (error) {
    console.error("Error creating stage update reply:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create stage update reply" });
  }
});

// Approve a manufacturing stage
router.post("/manufacturing/stages/:stageId/approve", requireAdmin, async (req, res) => {
  try {
    const validation = stageApprovalSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid approval data",
        details: validation.error.errors,
      });
    }

    const { comment: approvalComment } = validation.data;
    const adminUserId = req.user?.userId;

    if (!adminUserId) {
      return res.status(401).json({ error: "Admin user ID is required" });
    }

    // Approve the stage using workflow storage method
    const approvedStage = await storage.approveStage(req.params.stageId, adminUserId, approvalComment);

    if (!approvedStage) {
      return res.status(500).json({ error: "Failed to approve stage" });
    }

    // Send customer notification email when stage is approved
    try {
      const stage = await storage.getManufacturingStage(req.params.stageId);
      if (stage) {
        const process = await storage.getManufacturingProcess(stage.processId);
        if (process) {
          const order = await storage.getOrder(process.orderId);
          if (order) {
            const customer = await storage.getUser(order.userId);
            if (customer) {
              // Get the most recent update with photo for this stage
              const stageUpdates = await storage.getStageUpdates(stage.id, false); // Only public updates for customer
              const latestUpdateWithPhoto = stageUpdates.find(update => update.photos && update.photos.length > 0);
              
              await sendStageUpdateEmail(
                customer.email,
                customer.firstName || 'Customer',
                order.orderNumber,
                stage.name,
                'completed', // Admin approval means stage is completed
                `Your ${stage.name} stage has been approved and completed!`,
                latestUpdateWithPhoto?.photos?.[0]?.url // Use first photo URL
              );

              // Create notification record in database
              await storage.createNotification({
                userId: customer.id,
                orderId: order.id,
                processId: stage.processId,
                stageId: stage.id,
                type: 'stage_approved',
                title: `${stage.name} Approved`,
                message: `Your ${stage.name} stage has been approved and completed!`,
                imageUrl: latestUpdateWithPhoto?.photos?.[0]?.url,
                isRead: false
              });
              
              console.log(`Sent stage approval email to customer ${customer.email} for order ${order.orderNumber}, stage: ${stage.name}`);
            }
          }
        }
      }
    } catch (emailError) {
      console.error('Failed to send stage approval email:', emailError);
      // Don't fail the request if email fails
    }

    // Broadcast stage approval via SSE
    const stage = await storage.getManufacturingStage(req.params.stageId);
    if (stage && (global as any).broadcastStageApproved) {
      (global as any).broadcastStageApproved(stage.processId, approvedStage);
    }

    console.log(`Admin ${adminUserId} approved stage ${req.params.stageId}`);
    res.status(200).json({
      message: "Stage approved successfully",
      stage: approvedStage
    });
  } catch (error) {
    console.error("Error approving stage:", error);
    
    // Handle specific workflow errors with appropriate status codes
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("not found")) {
      return res.status(404).json({ error: errorMessage });
    }
    if (errorMessage.includes("awaiting_approval")) {
      return res.status(400).json({ error: errorMessage });
    }
    
    res.status(500).json({ error: "Failed to approve stage" });
  }
});

// Reject a manufacturing stage
router.post("/manufacturing/stages/:stageId/reject", requireAdmin, async (req, res) => {
  try {
    const validation = stageRejectionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid rejection data",
        details: validation.error.errors,
      });
    }

    const { reason: rejectionReason } = validation.data;
    const adminUserId = req.user?.userId;

    if (!adminUserId) {
      return res.status(401).json({ error: "Admin user ID is required" });
    }

    // Reject the stage using workflow storage method
    const rejectedStage = await storage.rejectStage(req.params.stageId, adminUserId, rejectionReason.trim());

    if (!rejectedStage) {
      return res.status(500).json({ error: "Failed to reject stage" });
    }

    // Broadcast stage rejection via SSE
    const stage = await storage.getManufacturingStage(req.params.stageId);
    if (stage && (global as any).broadcastStageRejected) {
      (global as any).broadcastStageRejected(stage.processId, rejectedStage);
    }

    // Send manufacturer notification when stage is rejected
    try {
      if (stage) {
        const process = await storage.getManufacturingProcess(stage.processId);
        if (process && process.assignedManufacturerId) {
          const order = await storage.getOrder(process.orderId);
          if (order) {
            // Create notification for manufacturer
            await storage.createNotification({
              userId: process.assignedManufacturerId,
              orderId: order.id,
              processId: process.id,
              stageId: stage.id,
              type: 'stage_rejected',
              title: `${stage.name} Rejected`,
              message: `Stage rejected: ${rejectionReason}`,
              isRead: false
            });
            
            console.log(`Created notification for manufacturer ${process.assignedManufacturerId} about stage rejection`);
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to create manufacturer notification for stage rejection:', notificationError);
      // Don't fail the request if notification fails
    }

    console.log(`Admin ${adminUserId} rejected stage ${req.params.stageId}: ${rejectionReason}`);
    res.status(200).json({
      message: "Stage rejected successfully",
      stage: rejectedStage
    });
  } catch (error) {
    console.error("Error rejecting stage:", error);
    
    // Handle specific workflow errors with appropriate status codes
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("not found")) {
      return res.status(404).json({ error: errorMessage });
    }
    if (errorMessage.includes("awaiting_approval")) {
      return res.status(400).json({ error: errorMessage });
    }
    
    res.status(500).json({ error: "Failed to reject stage" });
  }
});

// Manufacturing by Order ID (for easy order integration)
router.get("/manufacturing/by-order/:orderId", requireAdmin, async (req, res) => {
  try {
    const process = await storage.getManufacturingProcessByOrderId(req.params.orderId);
    if (!process) {
      return res.status(404).json({ error: "No manufacturing process found for this order" });
    }
    
    const fullProcess = await storage.getManufacturingProcessWithDetails(process.id);
    res.json(fullProcess);
  } catch (error) {
    console.error("Error fetching manufacturing process by order:", error);
    res.status(500).json({ error: "Failed to fetch manufacturing process" });
  }
});

// Direct Manufacturer Management Routes (Simple Manufacturer System)
router.get("/direct-manufacturers", requireAdmin, async (req, res) => {
  try {
    const manufacturers = await storage.getDirectManufacturers();
    res.json(manufacturers);
  } catch (error) {
    console.error("Error fetching direct manufacturers:", error);
    res.status(500).json({ error: "Failed to fetch manufacturers" });
  }
});

router.post("/direct-manufacturers", requireAdmin, async (req, res) => {
  try {
    const manufacturer = await storage.createDirectManufacturer(req.body, req.user?.userId!);
    console.log(`Admin ${req.user?.userId} created direct manufacturer ${manufacturer.id}`);
    res.status(201).json(manufacturer);
  } catch (error) {
    console.error("Error creating direct manufacturer:", error);
    res.status(500).json({ error: "Failed to create manufacturer" });
  }
});

router.get("/direct-manufacturers/:id", requireAdmin, async (req, res) => {
  try {
    const manufacturer = await storage.getDirectManufacturer(req.params.id);
    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer not found" });
    }
    res.json(manufacturer);
  } catch (error) {
    console.error("Error fetching direct manufacturer:", error);
    res.status(500).json({ error: "Failed to fetch manufacturer" });
  }
});

router.patch("/direct-manufacturers/:id", requireAdmin, async (req, res) => {
  try {
    const manufacturer = await storage.updateDirectManufacturer(req.params.id, req.body);
    if (!manufacturer) {
      return res.status(404).json({ error: "Manufacturer not found" });
    }
    console.log(`Admin ${req.user?.userId} updated direct manufacturer ${req.params.id}`);
    res.json(manufacturer);
  } catch (error) {
    console.error("Error updating direct manufacturer:", error);
    res.status(500).json({ error: "Failed to update manufacturer" });
  }
});

router.delete("/direct-manufacturers/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await storage.deleteDirectManufacturer(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Manufacturer not found" });
    }
    console.log(`Admin ${req.user?.userId} deleted direct manufacturer ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting direct manufacturer:", error);
    res.status(500).json({ error: "Failed to delete manufacturer" });
  }
});

// Customer Questions Routes - for admin-customer communication
router.get("/customer-questions", requireAdmin, async (req, res) => {
  try {
    // Fetch all customer questions (isCustomerQuestion: true) with replies
    const questions = await storage.getAllCustomerQuestions();
    res.json({ questions });
  } catch (error) {
    console.error("Error fetching customer questions:", error);
    res.status(500).json({ error: "Failed to fetch customer questions" });
  }
});

router.post("/customer-questions/reply", requireAdmin, async (req, res) => {
  try {
    const { questionId, message } = req.body;
    
    if (!questionId || !message) {
      return res.status(400).json({ error: "Question ID and message are required" });
    }
    
    // Get the customer question reply to find the parent update ID
    const customerQuestion = await storage.getStageUpdateReply(questionId);
    if (!customerQuestion) {
      return res.status(404).json({ error: "Customer question not found" });
    }
    
    // Create admin reply to the same parent update
    const reply = await storage.createCustomerQuestionReply({
      updateId: customerQuestion.updateId, // Use the same parent update as the customer question
      message: message.trim(),
      authorUserId: req.user?.userId!,
      authorRole: "admin",
      isCustomerQuestion: false, // Reply from admin
      isCustomerServiceReply: true, // Mark as customer service reply to exclude from Updates & Communication tab
    });
    
    // Create notification for the customer
    try {
      const update = await storage.getStageUpdate(customerQuestion.updateId);
      if (update) {
        const stage = await storage.getManufacturingStage(update.stageId);
        if (stage) {
          const process = await storage.getManufacturingProcess(stage.processId);
          if (process) {
            const order = await storage.getOrder(process.orderId);
            if (order) {
              await storage.createNotification({
                userId: order.userId,
                orderId: order.id,
                processId: process.id,
                stageId: stage.id,
                type: 'admin_message',
                title: 'Admin Response to Your Question',
                message: `Admin replied: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
                isRead: false
              });
            }
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to create notification for admin reply:', notificationError);
    }
    
    console.log(`Admin ${req.user?.userId} replied to customer question ${questionId}`);
    res.status(201).json(reply);
  } catch (error) {
    console.error("Error replying to customer question:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
});

export default router;