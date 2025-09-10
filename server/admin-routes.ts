import express from "express";
import { storage } from "./storage";
import { requireAdmin, verifyAuth } from "./utils/auth";
import { adminUpdateUserSchema, type AdminUpdateUserRequest, createDiscountCodeSchema, type CreateDiscountCodeRequest, createCategorySchema, updateCategorySchema, type CreateCategoryRequest, type UpdateCategoryRequest } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";

// Validation schemas for admin operations
const orderStatusUpdateSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "canceled"]),
  comment: z.string().optional()
});

const adminDiscountUpdateSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  type: z.enum(["percentage", "fixed"]).optional(),
  value: z.string().refine(val => !val || (parseFloat(val) >= 0), "Value must be a positive number").optional(),
  minimumOrderAmount: z.string().refine(val => !val || (parseFloat(val) >= 0), "Minimum order amount must be positive").optional(),
  maxUsageCount: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().optional()
});

const adminProductUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  basePrice: z.string().refine(val => !val || (parseFloat(val) >= 0), "Base price must be positive").optional(),
  status: z.enum(["active", "inactive", "out_of_stock"]).optional(),
  imageUrl: z.string().url().optional().nullable(),
  model3dUrl: z.string().url().optional().nullable(),
  pdfUrl: z.string().url().optional().nullable(),
  additionalImages: z.string().optional()
});

const router = express.Router();

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

// Admin Product Management Routes
router.get("/products", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const status = req.query.status as string;

    const products = await storage.getProducts({ page, limit, category, status });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.patch("/products/:id", requireAdmin, async (req, res) => {
  try {
    const validation = adminProductUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid product data", details: validation.error.flatten() });
    }

    const updatedProduct = await storage.updateProduct(req.params.id, validation.data);
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(`Admin ${req.user?.userId} updated product ${req.params.id}:`, validation.data);
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
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
    
    const discounts = await storage.getDiscountCodes({ page, limit });
    res.json(discounts);
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    res.status(500).json({ error: "Failed to fetch discount codes" });
  }
});

router.get("/discounts/:id", requireAdmin, async (req, res) => {
  try {
    const discount = await storage.getDiscountCodeById(req.params.id);
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
    const validation = createDiscountCodeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid discount code data", details: validation.error.flatten() });
    }

    const discount = await storage.createDiscountCode(validation.data);
    console.log(`Admin ${req.user?.userId} created discount code ${discount.code}`);
    res.status(201).json(discount);
  } catch (error) {
    console.error("Error creating discount code:", error);
    res.status(500).json({ error: "Failed to create discount code" });
  }
});

router.patch("/discounts/:id", requireAdmin, async (req, res) => {
  try {
    const validation = adminDiscountUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid update data", details: validation.error.flatten() });
    }

    const updatedDiscount = await storage.updateDiscountCode(req.params.id, validation.data);
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
    const deleted = await storage.deleteDiscountCode(req.params.id);
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
    if (error.message?.includes("unique constraint")) {
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
    if (error.message?.includes("unique constraint")) {
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

// Object Storage Routes
router.post("/objects/upload-url", requireAdmin, async (req, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const uploadParams = await objectStorageService.getUploadUrl();
    
    res.json({
      method: "PUT",
      url: uploadParams.url
    });
  } catch (error) {
    console.error("Error getting upload URL:", error);
    res.status(500).json({ error: "Failed to get upload URL" });
  }
});

router.post("/objects/finalize", requireAdmin, async (req, res) => {
  try {
    const { path, visibility } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: "Path is required" });
    }

    const objectStorageService = new ObjectStorageService();
    
    // Set object ACL based on visibility
    if (visibility === 'public') {
      await objectStorageService.trySetObjectEntityAclPolicy(path, 'public');
    }
    
    // Return normalized path
    const normalizedPath = `/objects/${path}`;
    
    res.json({ path: normalizedPath });
  } catch (error) {
    console.error("Error finalizing upload:", error);
    res.status(500).json({ error: "Failed to finalize upload" });
  }
});

export default router;