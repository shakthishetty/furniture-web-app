import express from "express";
import { storage } from "./storage";
import { verifyAuth } from "./utils/auth";
import { sendManufacturerNotificationEmail } from "./utils/email";
import { createStageUpdateReplySchema } from "@shared/schema";
import { z } from "zod";

const router = express.Router();

// Schema for marking notifications as read
const markAsReadSchema = z.object({
  notificationId: z.string().optional() // If not provided, mark all as read
});

// Schema for customer questions
const customerQuestionSchema = z.object({
  orderId: z.string(),
  stageId: z.string().optional(),
  message: z.string().min(1, "Message cannot be empty")
});

// GET /api/notifications - Get customer notifications
router.get("/", verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const isRead = req.query.isRead ? req.query.isRead === 'true' : undefined;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const notifications = await storage.getNotifications(userId, isRead);
    
    res.json({
      notifications,
      total: notifications.length
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get("/unread-count", verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const count = await storage.getUnreadNotificationCount(userId);
    
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// POST /api/notifications/mark-read - Mark notifications as read
router.post("/mark-read", verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const validation = markAsReadSchema.safeParse(req.body);
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validation.error.errors,
      });
    }

    const { notificationId } = validation.data;

    let success: boolean;
    if (notificationId) {
      // Mark specific notification as read
      success = await storage.markNotificationAsRead(notificationId, userId);
    } else {
      // Mark all notifications as read
      success = await storage.markAllNotificationsAsRead(userId);
    }

    if (!success) {
      return res.status(404).json({ error: "Notification not found or already read" });
    }

    res.json({ 
      message: notificationId ? "Notification marked as read" : "All notifications marked as read",
      success: true 
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// POST /api/notifications/ask-question - Customer asks question about order/stage
router.post("/ask-question", verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const validation = customerQuestionSchema.safeParse(req.body);
    
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: validation.error.errors,
      });
    }

    const { orderId, stageId, message } = validation.data;

    // Verify customer owns this order
    const order = await storage.getOrder(orderId);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get manufacturing process with full details
    const manufacturingProcess = await storage.getManufacturingProcessByOrderId(orderId);
    if (!manufacturingProcess) {
      return res.status(404).json({ error: "Manufacturing process not found" });
    }

    // Get full manufacturing process details with stages
    const fullProcess = await storage.getManufacturingProcessWithDetails(manufacturingProcess.id);
    if (!fullProcess || !fullProcess.stages || fullProcess.stages.length === 0) {
      return res.status(404).json({ error: "Manufacturing stages not found" });
    }

    // Find the target stage
    const targetStage = stageId 
      ? fullProcess.stages.find(s => s.id === stageId)
      : fullProcess.stages[0];
    
    if (!targetStage || !targetStage.updates || targetStage.updates.length === 0) {
      return res.status(404).json({ error: "No updates found for this stage" });
    }

    // Use the first update of the stage for the reply
    const targetUpdate = targetStage.updates[0];

    // Create customer question as a stage update reply
    const updateData = {
      updateId: targetUpdate.id,
      message: message,
      authorUserId: userId,
      authorRole: 'customer',
      isCustomerQuestion: true // New field to distinguish customer questions
    };

    const reply = await storage.createStageUpdateReply(updateData);

    // Notify manufacturer about new customer question
    if (manufacturingProcess.assignedManufacturerId) {
      const manufacturer = await storage.getUser(manufacturingProcess.assignedManufacturerId);
      
      // Get customer name
      const customer = await storage.getUser(userId);
      const customerName = customer?.firstName || 'A customer';

      // Create in-app notification for manufacturer
      try {
        await storage.createNotification({
          userId: manufacturingProcess.assignedManufacturerId,
          orderId: orderId,
          processId: manufacturingProcess.id,
          stageId: stageId || undefined,
          type: 'customer_question',
          title: 'New Customer Question',
          message: `${customerName} asked: ${message}`,
          isRead: false,
        });
      } catch (notificationError) {
        console.error('Failed to create in-app notification for manufacturer:', notificationError);
      }
      
      // Send email notification
      if (manufacturer?.email) {
        try {
          await sendManufacturerNotificationEmail(
            manufacturer.email,
            manufacturer.firstName || 'Manufacturer',
            order.orderNumber,
            `Customer Question: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
            'customer_question'
          );
        } catch (emailError) {
          console.error('Failed to send customer question email to manufacturer:', emailError);
        }
      }
    }

    res.json({ 
      message: "Question sent successfully",
      reply,
      success: true 
    });
  } catch (error) {
    console.error("Error sending customer question:", error);
    res.status(500).json({ error: "Failed to send question" });
  }
});

export default router;