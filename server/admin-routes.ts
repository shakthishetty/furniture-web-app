import express from "express";
import { storage } from "./storage";
import { requireAdmin, verifyAuth } from "./utils/auth";
import { adminUpdateUserSchema, type AdminUpdateUserRequest } from "@shared/schema";
import { z } from "zod";

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
    const allowedUpdates = ["name", "description", "category", "basePrice", "status", "imageUrl", "model3dUrl"];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {} as any);

    const updatedProduct = await storage.updateProduct(req.params.id, updates);
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(`Admin ${req.user?.userId} updated product ${req.params.id}:`, updates);
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
    const { status, comment } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

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

export default router;