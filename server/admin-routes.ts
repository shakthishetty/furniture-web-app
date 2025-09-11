import express from "express";
import { storage } from "./storage";
import { requireAdmin, verifyAuth } from "./utils/auth";
import { adminUpdateUserSchema, type AdminUpdateUserRequest, createDiscountCodeSchema, type CreateDiscountCodeRequest, createCategorySchema, updateCategorySchema, type CreateCategoryRequest, type UpdateCategoryRequest, createManufacturingProcessSchema, updateManufacturingProcessSchema, createManufacturingStageSchema, updateManufacturingStageSchema, createStageUpdateSchema, createStageUpdateReplySchema, manufacturingStatusUpdateSchema, stageStatusUpdateSchema, manufacturerAssignmentSchema, type CreateManufacturingProcessRequest, type UpdateManufacturingProcessRequest, type CreateManufacturingStageRequest, type UpdateManufacturingStageRequest, type CreateStageUpdateRequest, type CreateStageUpdateReplyRequest, type ManufacturingStatusUpdateRequest, type StageStatusUpdateRequest, type ManufacturerAssignmentRequest } from "@shared/schema";
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

    const { expiresAt, ...restData } = validation.data;
    const updateData = {
      ...restData,
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {})
    };
    const updatedDiscount = await storage.updateDiscountCode(req.params.id, updateData);
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

// Object Storage Routes
router.post("/objects/upload-url", requireAdmin, async (req, res) => {
  try {
    const objectStorageService = new ObjectStorageService();
    const uploadUrl = await objectStorageService.getObjectEntityUploadURL();
    
    res.json({
      method: "PUT",
      url: uploadUrl
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

    // Validate path format for security - allow object storage paths
    if (!path || path.includes('..') || path.startsWith('/')) {
      return res.status(400).json({ error: "Invalid path format" });
    }

    const objectStorageService = new ObjectStorageService();
    
    // Set object ACL based on visibility
    if (visibility === 'public') {
      const aclPolicy = {
        owner: req.user?.userId || 'admin',
        visibility: 'public' as const,
      };
      await objectStorageService.trySetObjectEntityAclPolicy(path, aclPolicy);
    }
    
    // Return normalized path
    const normalizedPath = objectStorageService.normalizeObjectEntityPath(path);
    
    res.json({ path: normalizedPath });
  } catch (error) {
    console.error("Error finalizing upload:", error);
    res.status(500).json({ error: "Failed to finalize upload" });
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
    res.json(result);
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
router.put("/manufacturing/processes/:id/assign", requireAdmin, async (req, res) => {
  try {
    const validation = manufacturerAssignmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid assignment data",
        details: validation.error.errors,
      });
    }

    const { manufacturerId } = validation.data;

    // Validate manufacturer exists and has correct role if not null
    if (manufacturerId) {
      const manufacturer = await storage.getUserById(manufacturerId);
      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" });
      }
      if (manufacturer.role !== 'manufacturer') {
        return res.status(400).json({ error: "User is not a manufacturer" });
      }
      if (manufacturer.status !== 'active') {
        return res.status(400).json({ error: "Manufacturer is not active" });
      }
    }

    const updatedProcess = await storage.assignManufacturerToProcess(req.params.id, manufacturerId);
    if (!updatedProcess) {
      return res.status(404).json({ error: "Manufacturing process not found" });
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
    
    // Broadcast stage update to SSE connections
    const stage = await storage.getManufacturingStage(req.params.stageId);
    if (stage && global.broadcastStageUpdate) {
      global.broadcastStageUpdate(stage.processId, update);
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
    
    // Broadcast new reply to SSE connections
    const update = await storage.getStageUpdate(req.params.updateId);
    if (update) {
      const stage = await storage.getManufacturingStage(update.stageId);
      if (stage && global.broadcastNewReply) {
        global.broadcastNewReply(stage.processId, reply);
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

export default router;