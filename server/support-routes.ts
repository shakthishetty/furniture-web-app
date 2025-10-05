import { Router } from "express";
import { storage } from "./storage";
import { createSupportTicketSchema, updateSupportTicketSchema } from "@shared/schema";
import { sendEmail } from "./utils/email";

const router = Router();

// Send support ticket confirmation email to user
async function sendSupportTicketConfirmationEmail(
  userEmail: string,
  userName: string,
  ticketId: string,
  subject: string,
  category: string
): Promise<boolean> {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background-color: #254127; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Teak Theory Support</h1>
      </div>
      
      <div style="padding: 30px 20px;">
        <h2 style="color: #254127;">Thank you for contacting us, ${userName}!</h2>
        
        <p>We've received your support request and our team will get back to you as soon as possible.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
        </div>
        
        <p>Our typical response time is within 24 hours during business days.</p>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">
            <strong>📧 Please keep this ticket ID for your reference.</strong>
          </p>
        </div>
      </div>
      
      <hr style="margin: 30px 20px; border: none; border-top: 1px solid #eee;">
      <div style="padding: 0 20px 20px;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent from Teak Theory Support
        </p>
      </div>
    </div>
  `;

  return await sendEmail(userEmail, `Support Ticket Received - #${ticketId}`, html);
}

// Send admin notification email
async function sendAdminNotificationEmail(
  subject: string,
  category: string,
  message: string,
  userName: string,
  userEmail: string,
  ticketId: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) {
    console.warn('Admin email not configured, skipping admin notification');
    return false;
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  const ticketUrl = `${baseUrl}/admin/support/${ticketId}`;
  
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background-color: #254127; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎫 New Support Ticket</h1>
      </div>
      
      <div style="padding: 30px 20px;">
        <h2 style="color: #254127;">New Support Request</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${ticketId}</p>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${userName} (${userEmail})</p>
          <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          <p style="margin: 15px 0 5px 0;"><strong>Message:</strong></p>
          <p style="margin: 5px 0; padding: 10px; background-color: white; border-left: 3px solid #254127;">
            ${message}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${ticketUrl}" 
             style="background-color: #254127; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Ticket
          </a>
        </div>
      </div>
      
      <hr style="margin: 30px 20px; border: none; border-top: 1px solid #eee;">
      <div style="padding: 0 20px 20px;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          This email was sent from Teak Theory Support System
        </p>
      </div>
    </div>
  `;

  return await sendEmail(adminEmail, `New Support Ticket: ${category} - ${subject}`, html);
}

// Create a new support ticket (public endpoint - no auth required)
router.post("/", async (req, res) => {
  try {
    const validatedData = createSupportTicketSchema.parse(req.body);
    const userId = req.user?.userId;
    const user = userId ? await storage.getUser(userId) : null;
    
    // Create support ticket
    const ticket = await storage.createSupportTicket(
      validatedData,
      userId,
      user?.role || 'guest'
    );

    // Send confirmation email to user
    await sendSupportTicketConfirmationEmail(
      validatedData.email,
      validatedData.name,
      ticket.id,
      validatedData.subject,
      validatedData.category
    );

    // Send notification email to admin
    await sendAdminNotificationEmail(
      validatedData.subject,
      validatedData.category,
      validatedData.message,
      validatedData.name,
      validatedData.email,
      ticket.id
    );

    res.json({ 
      success: true, 
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    res.status(400).json({ error: error.message || "Failed to create support ticket" });
  }
});

// Get support tickets (for logged-in users - their own tickets)
router.get("/", async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    
    // Customers see only their tickets
    // Admins and manufacturers can see filtered tickets
    const tickets = await storage.getSupportTickets({
      userId: user?.role === 'customer' ? userId : undefined,
      status: req.query.status as string,
      category: req.query.category as string,
    });

    res.json({ tickets });
  } catch (error: any) {
    console.error("Error fetching support tickets:", error);
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

// Get all support tickets (admin only)
router.get("/all", async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized - Admin access required" });
    }

    const tickets = await storage.getSupportTickets({
      status: req.query.status as string,
      category: req.query.category as string,
      assignedTo: req.query.assignedTo as string,
    });

    res.json({ tickets });
  } catch (error: any) {
    console.error("Error fetching all support tickets:", error);
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

// Get manufacturing support tickets (manufacturer only)
router.get("/manufacturer", async (req, res) => {
  try {
    const manufacturerId = req.manufacturerUser?.manufacturerId;
    
    if (!manufacturerId) {
      return res.status(401).json({ error: "Not authenticated as manufacturer" });
    }

    const tickets = await storage.getSupportTickets({
      category: "manufacturing",
      status: req.query.status as string,
    });

    res.json({ tickets });
  } catch (error: any) {
    console.error("Error fetching manufacturer support tickets:", error);
    res.status(500).json({ error: "Failed to fetch support tickets" });
  }
});

// Get a single support ticket
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const ticketId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    const ticket = await storage.getSupportTicket(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    // Verify access: user owns ticket or is admin
    if (ticket.userId !== userId && user?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ ticket });
  } catch (error: any) {
    console.error("Error fetching support ticket:", error);
    res.status(500).json({ error: "Failed to fetch support ticket" });
  }
});

// Update support ticket (admin or manufacturer)
router.patch("/:id", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const manufacturerId = req.manufacturerUser?.manufacturerId;
    const ticketId = req.params.id;
    
    if (!userId && !manufacturerId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check if admin
    let isAdmin = false;
    if (userId) {
      const user = await storage.getUser(userId);
      isAdmin = user?.role === 'admin';
    }

    // Manufacturers can only update manufacturing tickets
    if (manufacturerId && !isAdmin) {
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket || ticket.category !== 'manufacturing') {
        return res.status(403).json({ error: "Unauthorized - Can only update manufacturing tickets" });
      }
    } else if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized - Admin access required" });
    }

    const validatedData = updateSupportTicketSchema.parse(req.body);
    const ticket = await storage.updateSupportTicket(ticketId, validatedData);

    if (!ticket) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    res.json({ ticket });
  } catch (error: any) {
    console.error("Error updating support ticket:", error);
    res.status(400).json({ error: error.message || "Failed to update support ticket" });
  }
});

// Delete support ticket (admin only)
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const ticketId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized - Admin access required" });
    }

    await storage.deleteSupportTicket(ticketId);

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting support ticket:", error);
    res.status(500).json({ error: "Failed to delete support ticket" });
  }
});

export default router;
