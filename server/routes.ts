import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./auth-routes";
import googleAuthRoutes from "./google-auth";
import configuratorRoutes from "./configurator-routes";
import { registerOrderRoutes } from "./order-routes";
import adminRoutes from "./admin-routes";
import { initializeSampleData } from "./seed-data";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { verifyAuth } from "./utils/auth";
import { createStageUpdateReplySchema, type CreateStageUpdateReplyRequest } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize sample data
  await initializeSampleData();
  
  // Authentication routes
  app.use('/api/auth', authRoutes);
  app.use('/api/auth', googleAuthRoutes);
  
  // Product Configurator routes
  app.use('/api/configurator', configuratorRoutes);

  // Order Management routes
  registerOrderRoutes(app);
  
  // Admin routes
  app.use('/api/admin', adminRoutes);

  // Object Storage routes for file uploads
  const objectStorageService = new ObjectStorageService();

  // Public object serving endpoint  
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Private object serving endpoint (for uploaded files)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for file upload
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ 
        method: 'PUT' as const,
        url: uploadURL
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Process uploaded file and set ACL policy
  app.put("/api/objects/process", async (req, res) => {
    if (!req.body.fileUrl) {
      return res.status(400).json({ error: "fileUrl is required" });
    }

    try {
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.fileUrl);
      
      // For now, set all uploaded files as public
      // In production, you'd check user auth and set appropriate ACL
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.fileUrl,
        {
          owner: 'admin', // In real app, use authenticated user ID
          visibility: "public",
        }
      );

      res.status(200).json({
        objectPath: normalizedPath,
      });
    } catch (error) {
      console.error("Error processing uploaded file:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ====================================
  // Customer Manufacturing Tracking API
  // ====================================

  // Get manufacturing tracking for customer's order
  app.get('/api/orders/:orderId/tracking', verifyAuth, async (req, res) => {
    try {
      // First verify the order belongs to the customer
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.userId !== req.user?.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get manufacturing process for this order
      const process = await storage.getManufacturingProcessByOrderId(req.params.orderId);
      if (!process) {
        return res.status(404).json({ error: "No manufacturing tracking found for this order" });
      }

      // Get full process details with customer-visible updates only
      const fullProcess = await storage.getManufacturingProcessWithDetails(process.id);
      
      if (!fullProcess) {
        return res.status(404).json({ error: "Manufacturing process not found" });
      }

      // Filter out internal updates and internal replies for customer privacy
      const customerProcess = {
        ...fullProcess,
        stages: fullProcess.stages.map(stage => ({
          ...stage,
          updates: stage.updates
            .filter(update => !update.isInternal)
            .map(update => ({
              ...update,
              replies: update.replies.filter(reply => reply.authorRole === 'customer')
            }))
        }))
      };

      res.json(customerProcess);
    } catch (error) {
      console.error("Error fetching order tracking:", error);
      res.status(500).json({ error: "Failed to fetch order tracking" });
    }
  });

  // Customer replies to manufacturing updates
  app.post('/api/orders/:orderId/tracking/updates/:updateId/replies', verifyAuth, async (req, res) => {
    try {
      // First verify the order belongs to the customer
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.userId !== req.user?.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Verify the update exists, is not internal, and belongs to this order's manufacturing process
      const update = await storage.getStageUpdate(req.params.updateId);
      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Prevent customers from replying to internal updates
      if (update.isInternal) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Get the stage to verify it belongs to this order's process
      const stage = await storage.getManufacturingStage(update.stageId);
      if (!stage) {
        return res.status(404).json({ error: "Stage not found" });
      }

      const process = await storage.getManufacturingProcess(stage.processId);
      if (!process || process.orderId !== req.params.orderId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Validate request body
      const validatedData = createStageUpdateReplySchema.parse({
        ...req.body,
        updateId: req.params.updateId,
        authorUserId: req.user?.userId,
        authorRole: "customer"
      });

      // Create the reply
      const reply = await storage.createStageUpdateReply(validatedData);
      
      console.log(`Customer ${req.user?.userId} posted reply ${reply.id} to update ${req.params.updateId}`);
      res.status(201).json(reply);
    } catch (error) {
      console.error("Error creating customer reply:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create reply" });
    }
  });

  // Get all replies for a specific update (customer view)
  app.get('/api/orders/:orderId/tracking/updates/:updateId/replies', verifyAuth, async (req, res) => {
    try {
      // First verify the order belongs to the customer
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.userId !== req.user?.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Verify the update exists, is customer-visible, and belongs to this order's manufacturing process
      const update = await storage.getStageUpdate(req.params.updateId);
      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Prevent customers from accessing replies on internal updates
      if (update.isInternal) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Additional verification that this update belongs to customer's order
      const stage = await storage.getManufacturingStage(update.stageId);
      if (!stage) {
        return res.status(404).json({ error: "Stage not found" });
      }

      const process = await storage.getManufacturingProcess(stage.processId);
      if (!process || process.orderId !== req.params.orderId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all replies for this update, but filter to customer-visible only
      const allReplies = await storage.getStageUpdateReplies(req.params.updateId);
      const customerVisibleReplies = allReplies.filter(reply => reply.authorRole === 'customer');
      res.json(customerVisibleReplies);
    } catch (error) {
      console.error("Error fetching update replies:", error);
      res.status(500).json({ error: "Failed to fetch replies" });
    }
  });

  // Get customer's orders with manufacturing status
  app.get('/api/orders/with-tracking', verifyAuth, async (req, res) => {
    try {
      // Get all customer orders
      const orders = await storage.getUserOrders(req.user?.userId as string);
      
      // For each order, check if there's a manufacturing process
      const ordersWithTracking = await Promise.all(
        orders.map(async (order) => {
          const process = await storage.getManufacturingProcessByOrderId(order.id);
          return {
            ...order,
            hasTracking: !!process,
            trackingStatus: process?.status || null
          };
        })
      );

      res.json(ordersWithTracking);
    } catch (error) {
      console.error("Error fetching orders with tracking:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Example protected route
  app.get('/api/user/profile', async (req, res) => {
    // This route would be protected by authentication middleware
    res.json({ message: 'Profile data would go here' });
  });

  const httpServer = createServer(app);

  return httpServer;
}
