import express from "express";
import { storage } from "./storage";
import { requireManufacturer, verifyAuth } from "./utils/auth";
import { 
  createStageUpdateSchema, 
  createStageUpdateReplySchema, 
  stageStatusUpdateSchema,
  type CreateStageUpdateRequest, 
  type CreateStageUpdateReplyRequest, 
  type StageStatusUpdateRequest 
} from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";

const router = express.Router();

// Middleware to verify manufacturer access to a process
const verifyProcessAccess = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const processId = req.params.id || req.params.processId;
    const manufacturerId = req.user?.userId;

    if (!processId) {
      return res.status(400).json({ error: "Process ID is required" });
    }

    const process = await storage.getManufacturingProcess(processId);
    if (!process) {
      return res.status(404).json({ error: "Manufacturing process not found" });
    }

    // Check if this manufacturer is assigned to this process
    if (process.assignedManufacturerId !== manufacturerId) {
      return res.status(403).json({ error: "Access denied. Process not assigned to this manufacturer." });
    }

    // Attach process to request for use in route handlers
    req.manufacturingProcess = process;
    next();
  } catch (error) {
    console.error("Error verifying process access:", error);
    res.status(500).json({ error: "Failed to verify process access" });
  }
};

// Middleware to verify stage belongs to the process and manufacturer has access
const verifyStageAccess = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const stageId = req.params.stageId;
    const process = req.manufacturingProcess;

    if (!stageId) {
      return res.status(400).json({ error: "Stage ID is required" });
    }

    const stage = await storage.getManufacturingStage(stageId);
    if (!stage) {
      return res.status(404).json({ error: "Manufacturing stage not found" });
    }

    // Verify stage belongs to the process
    if (stage.processId !== process.id) {
      return res.status(403).json({ error: "Stage does not belong to this process" });
    }

    req.manufacturingStage = stage;
    next();
  } catch (error) {
    console.error("Error verifying stage access:", error);
    res.status(500).json({ error: "Failed to verify stage access" });
  }
};

// Get current manufacturer's authentication status
router.get("/auth/me", verifyAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user from database to check manufacturer status
    const user = await storage.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    console.error("Error getting manufacturer user:", error);
    res.status(500).json({ error: "Failed to get user information" });
  }
});

// 1. GET /api/manufacturer/processes - List processes assigned to the authenticated manufacturer
router.get("/processes", requireManufacturer, async (req, res) => {
  try {
    const manufacturerId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    console.log(`[DEBUG] Manufacturer ${manufacturerId} requesting processes - page: ${page}, limit: ${limit}, status: ${status}`);

    // Get processes assigned to this manufacturer
    const result = await storage.getManufacturingProcesses({
      page,
      limit,
      status,
      manufacturerId
    });

    console.log(`[DEBUG] Found ${result.total} total processes for manufacturer ${manufacturerId}, returning ${result.processes.length} processes`);

    // For each process, get comprehensive information including customer details
    const processesWithDetails = await Promise.all(
      result.processes.map(async (process) => {
        const [stages, order] = await Promise.all([
          storage.getManufacturingStages(process.id),
          storage.getOrder(process.orderId)
        ]);

        // Get customer information and addresses if order exists
        let customer = null;
        let orderItems: any[] = [];
        let shippingAddress = null;
        let billingAddress = null;

        if (order) {
          // Get customer details
          customer = await storage.getUser(order.userId);
          
          // Get order items
          orderItems = await storage.getOrderItems(order.id);
          
          // Get addresses
          if (order.shippingAddressId) {
            shippingAddress = await storage.getAddress(order.shippingAddressId);
          }
          if (order.billingAddressId) {
            billingAddress = await storage.getAddress(order.billingAddressId);
          }
        }

        // Get recent updates for each stage (limit to 3 most recent per stage)
        const stagesWithRecentUpdates = await Promise.all(
          stages.map(async (stage) => {
            const updates = await storage.getStageUpdates(stage.id, true); // include internal updates for manufacturer
            return {
              ...stage,
              recentUpdates: updates.slice(0, 3) // Get 3 most recent updates
            };
          })
        );

        return {
          ...process,
          order: order ? {
            id: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            // Customer information
            customer: customer ? {
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email
            } : null,
            // Order items for product details
            items: orderItems.map(item => ({
              id: item.id,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              productImage: item.productImage
            })),
            // Addresses
            shippingAddress,
            billingAddress
          } : null,
          stages: stagesWithRecentUpdates,
          totalStages: stages.length,
          completedStages: stages.filter(s => s.status === 'completed').length
        };
      })
    );

    res.json({
      processes: processesWithDetails,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (error) {
    console.error("Error fetching manufacturer processes:", error);
    res.status(500).json({ error: "Failed to fetch processes" });
  }
});

// 2. GET /api/manufacturer/processes/:id - Get detailed process information
router.get("/processes/:id", requireManufacturer, verifyProcessAccess, async (req, res) => {
  try {
    const process = req.manufacturingProcess;
    
    // Get full process details with all stages, updates, photos, and replies
    const fullProcess = await storage.getManufacturingProcessWithDetails(process.id);
    
    if (!fullProcess) {
      return res.status(404).json({ error: "Process details not found" });
    }

    // Get comprehensive order information
    const orderWithItems = await storage.getOrderWithItems(process.orderId);
    
    let comprehensiveOrderDetails = null;
    
    if (orderWithItems) {
      // Get customer information
      const customer = await storage.getUser(orderWithItems.userId);
      
      // Get addresses
      const shippingAddress = orderWithItems.shippingAddressId 
        ? await storage.getAddress(orderWithItems.shippingAddressId) 
        : null;
      const billingAddress = orderWithItems.billingAddressId 
        ? await storage.getAddress(orderWithItems.billingAddressId) 
        : null;
      
      // Note: Order status history functionality can be added later if needed
      
      comprehensiveOrderDetails = {
        // Basic order info
        id: orderWithItems.id,
        orderNumber: orderWithItems.orderNumber,
        status: orderWithItems.status,
        paymentStatus: orderWithItems.paymentStatus,
        paymentMethod: orderWithItems.paymentMethod,
        
        // Pricing details
        subtotal: orderWithItems.subtotal,
        discountAmount: orderWithItems.discountAmount,
        taxAmount: orderWithItems.taxAmount,
        shippingAmount: orderWithItems.shippingAmount,
        totalAmount: orderWithItems.totalAmount,
        
        // Customer information
        customer: customer ? {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email
        } : null,
        
        // Order items with product details
        items: orderWithItems.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          customConfiguration: item.customConfiguration
        })),
        
        // Addresses
        shippingAddress: shippingAddress ? {
          label: shippingAddress.label,
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          street: shippingAddress.street,
          apartment: shippingAddress.apartment,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone
        } : null,
        
        billingAddress: billingAddress ? {
          label: billingAddress.label,
          firstName: billingAddress.firstName,
          lastName: billingAddress.lastName,
          street: billingAddress.street,
          apartment: billingAddress.apartment,
          city: billingAddress.city,
          state: billingAddress.state,
          postalCode: billingAddress.postalCode,
          country: billingAddress.country,
          phone: billingAddress.phone
        } : null,
        
        // Additional details
        discountCodeUsed: orderWithItems.discountCodeUsed,
        trackingNumber: orderWithItems.trackingNumber,
        shippingCarrier: orderWithItems.shippingCarrier,
        estimatedDeliveryDate: orderWithItems.estimatedDeliveryDate,
        
        // Order history - can be added later if needed
        
        // Timestamps
        createdAt: orderWithItems.createdAt,
        updatedAt: orderWithItems.updatedAt
      };
    }
    
    // Include comprehensive order details
    const processWithOrderDetails = {
      ...fullProcess,
      order: comprehensiveOrderDetails
    };

    res.json(processWithOrderDetails);
  } catch (error) {
    console.error("Error fetching process details:", error);
    res.status(500).json({ error: "Failed to fetch process details" });
  }
});

// 3. PUT /api/manufacturer/processes/:id/stages/:stageId/status - Update stage status
router.put("/processes/:id/stages/:stageId/status", requireManufacturer, verifyProcessAccess, verifyStageAccess, async (req, res) => {
  try {
    const stage = req.manufacturingStage;
    const validation = stageStatusUpdateSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid stage status update data",
        details: validation.error.errors,
      });
    }

    const updateData = validation.data;

    // VALIDATION: If trying to mark as completed, ensure there are photos and updates
    if (updateData.status === 'completed') {
      // Get all updates for this stage (including internal updates)
      const stageUpdates = await storage.getStageUpdates(stage.id, true);
      
      // Check if there are any updates with photos
      const updatesWithPhotos = stageUpdates.filter(update => 
        update.photos && update.photos.length > 0
      );
      
      // Check if there are any meaningful progress updates (not just empty messages)
      const meaningfulUpdates = stageUpdates.filter(update => 
        update.message && update.message.trim().length > 10
      );
      
      if (updatesWithPhotos.length === 0) {
        return res.status(400).json({ 
          error: "Cannot mark stage as completed: No photos have been uploaded for this stage. Please upload at least one photo showing the progress before marking as completed." 
        });
      }
      
      if (meaningfulUpdates.length === 0) {
        return res.status(400).json({ 
          error: "Cannot mark stage as completed: No meaningful progress updates have been posted. Please add a detailed update describing the work completed before marking as completed." 
        });
      }
      
      console.log(`Stage completion validation passed: ${updatesWithPhotos.length} updates with photos, ${meaningfulUpdates.length} meaningful updates`);
    }

    // Auto-set timestamps based on status
    if (updateData.status === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date().toISOString();
    }
    if (updateData.status === 'completed' && !updateData.completedAt) {
      updateData.completedAt = new Date().toISOString();
    }

    const updatedStage = await storage.updateManufacturingStage(stage.id, updateData);
    
    if (!updatedStage) {
      return res.status(404).json({ error: "Failed to update stage" });
    }

    // Update process current stage if this stage is now in progress
    if (updateData.status === 'in_progress') {
      await storage.updateManufacturingProcess(req.manufacturingProcess.id, {
        status: 'in_progress',
        currentStageId: stage.id
      });
    }

    // Check if all stages are completed to mark process as completed
    const allStages = await storage.getManufacturingStages(req.manufacturingProcess.id);
    const allCompleted = allStages.every(s => s.id === stage.id ? updateData.status === 'completed' : s.status === 'completed');
    
    if (allCompleted) {
      await storage.updateManufacturingProcess(req.manufacturingProcess.id, {
        status: 'completed'
      });
    }

    // Broadcast stage status update via SSE
    if ((global as any).broadcastStageStatusUpdate) {
      (global as any).broadcastStageStatusUpdate(req.manufacturingProcess.id, updatedStage);
    }

    console.log(`Manufacturer ${req.user?.userId} updated stage ${stage.id} status to ${updateData.status}`);
    res.json(updatedStage);
  } catch (error) {
    console.error("Error updating stage status:", error);
    res.status(500).json({ error: "Failed to update stage status" });
  }
});

// 4. POST /api/manufacturer/processes/:id/stages/:stageId/updates - Create stage update
router.post("/processes/:id/stages/:stageId/updates", requireManufacturer, verifyProcessAccess, verifyStageAccess, async (req, res) => {
  try {
    const stage = req.manufacturingStage;
    
    // Debug: Log the incoming request data
    console.log("Stage update request body:", JSON.stringify(req.body, null, 2));
    console.log("Photos array:", req.body.photos);
    
    const validation = createStageUpdateSchema.safeParse({
      ...req.body,
      stageId: stage.id,
      authorUserId: req.user?.userId,
      authorRole: "manufacturer"
    });

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid stage update data",
        details: validation.error.errors,
      });
    }

    const updateData = validation.data;
    const stageUpdate = await storage.createStageUpdate(updateData);

    // Broadcast new update via SSE
    if ((global as any).broadcastNewUpdate) {
      (global as any).broadcastNewUpdate(req.manufacturingProcess.id, stageUpdate);
    }

    console.log(`Manufacturer ${req.user?.userId} created update for stage ${stage.id}`);
    res.status(201).json(stageUpdate);
  } catch (error) {
    console.error("Error creating stage update:", error);
    res.status(500).json({ error: "Failed to create stage update" });
  }
});

// 5. POST /api/manufacturer/processes/:id/stages/:stageId/updates/:updateId/replies - Reply to updates
router.post("/processes/:id/stages/:stageId/updates/:updateId/replies", requireManufacturer, verifyProcessAccess, verifyStageAccess, async (req, res) => {
  try {
    const updateId = req.params.updateId;
    
    // Verify the update exists and belongs to this stage
    const update = await storage.getStageUpdate(updateId);
    if (!update) {
      return res.status(404).json({ error: "Update not found" });
    }

    if (update.stageId !== req.manufacturingStage.id) {
      return res.status(403).json({ error: "Update does not belong to this stage" });
    }

    const validation = createStageUpdateReplySchema.safeParse({
      ...req.body,
      updateId: updateId,
      authorUserId: req.user?.userId,
      authorRole: "manufacturer"
    });

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid reply data",
        details: validation.error.errors,
      });
    }

    const reply = await storage.createStageUpdateReply(validation.data);

    // Broadcast new reply via SSE
    if ((global as any).broadcastNewReply) {
      (global as any).broadcastNewReply(req.manufacturingProcess.id, reply);
    }

    console.log(`Manufacturer ${req.user?.userId} replied to update ${updateId}`);
    res.status(201).json(reply);
  } catch (error) {
    console.error("Error creating reply:", error);
    res.status(500).json({ error: "Failed to create reply" });
  }
});

// 6. POST /api/manufacturer/processes/:id/stages/:stageId/photos - Upload photos for stage
router.post("/processes/:id/stages/:stageId/photos", requireManufacturer, verifyProcessAccess, verifyStageAccess, async (req, res) => {
  try {
    const { photoUrls, message } = req.body;

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return res.status(400).json({ error: "At least one photo URL is required" });
    }

    // Validate photo URLs
    const urlSchema = z.array(z.string().url());
    const validation = urlSchema.safeParse(photoUrls);
    
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid photo URLs",
        details: validation.error.errors,
      });
    }

    // Create a stage update with the photos
    const updateData = {
      stageId: req.manufacturingStage.id,
      authorUserId: req.user?.userId || '',
      authorRole: "manufacturer" as const,
      message: message || "Photo update",
      isInternal: false,
      photos: photoUrls
    };

    const stageUpdate = await storage.createStageUpdate(updateData);

    // Broadcast new photo update via SSE
    if ((global as any).broadcastNewUpdate) {
      (global as any).broadcastNewUpdate(req.manufacturingProcess.id, stageUpdate);
    }

    console.log(`Manufacturer ${req.user?.userId} uploaded ${photoUrls.length} photos for stage ${req.manufacturingStage.id}`);
    res.status(201).json({
      message: "Photos uploaded successfully",
      updateId: stageUpdate.id,
      photoCount: photoUrls.length
    });
  } catch (error) {
    console.error("Error uploading photos:", error);
    res.status(500).json({ error: "Failed to upload photos" });
  }
});

// Additional utility route: Get assigned manufacturer's dashboard stats
router.get("/dashboard/stats", requireManufacturer, async (req, res) => {
  try {
    const manufacturerId = req.user?.userId;

    // Get all processes assigned to this manufacturer
    const allProcesses = await storage.getManufacturingProcesses({
      page: 1,
      limit: 1000, // Get all processes for stats
      manufacturerId
    });

    // Calculate statistics
    const stats = {
      totalProcesses: allProcesses.total,
      activeProcesses: allProcesses.processes.filter(p => p.status === 'in_progress').length,
      completedProcesses: allProcesses.processes.filter(p => p.status === 'completed').length,
      pendingProcesses: allProcesses.processes.filter(p => p.status === 'pending').length,
      pausedProcesses: allProcesses.processes.filter(p => p.status === 'paused').length,
    };

    // Get processes needing attention (overdue or blocked stages)
    const processesNeedingAttention = [];
    for (const process of allProcesses.processes.slice(0, 10)) { // Limit to 10 for performance
      const stages = await storage.getManufacturingStages(process.id);
      const hasBlockedStages = stages.some(s => s.status === 'blocked');
      const hasOverdueStages = stages.some(s => {
        if (s.status !== 'in_progress' || !s.startedAt || !s.estimatedDuration) {
          return false;
        }
        const startTime = new Date(s.startedAt).getTime();
        const currentTime = new Date().getTime();
        const estimatedDuration = s.estimatedDuration * 60 * 60 * 1000; // Convert hours to milliseconds
        return currentTime - startTime > estimatedDuration;
      });

      if (hasBlockedStages || hasOverdueStages) {
        processesNeedingAttention.push({
          processId: process.id,
          orderId: process.orderId,
          status: process.status,
          hasBlockedStages,
          hasOverdueStages
        });
      }
    }

    res.json({
      ...stats,
      processesNeedingAttention,
      recentActivity: allProcesses.processes
        .sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5)
        .map(p => ({
          processId: p.id,
          orderId: p.orderId,
          status: p.status,
          updatedAt: p.updatedAt
        }))
    });
  } catch (error) {
    console.error("Error fetching manufacturer dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// Extend Express Request interface for TypeScript
declare global {
  namespace Express {
    interface Request {
      manufacturingProcess?: any;
      manufacturingStage?: any;
    }
  }
}

export default router;