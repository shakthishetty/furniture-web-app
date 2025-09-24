import express from "express";
import { storage } from "./storage";
import { verifyAuth } from "./utils/auth";
import { z } from "zod";

const router = express.Router();

// Schema for marking notifications as read
const markAsReadSchema = z.object({
  notificationId: z.string().optional() // If not provided, mark all as read
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

export default router;