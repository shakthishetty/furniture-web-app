import { Router } from "express";
import { storage } from "./storage";
import { createFaqSchema, updateFaqSchema } from "@shared/schema";
import { requireAdmin } from "./utils/auth";

const router = Router();

// Get all active FAQs (public)
router.get("/", async (req, res) => {
  try {
    const faqs = await storage.getFaqs({ isActive: true });
    res.json({ faqs });
  } catch (error: any) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// Get all FAQs (admin only - includes inactive)
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const faqs = await storage.getFaqs();
    res.json({ faqs });
  } catch (error: any) {
    console.error("Error fetching all FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// Get a single FAQ
router.get("/:id", async (req, res) => {
  try {
    const faq = await storage.getFaq(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ error: "FAQ not found" });
    }
    
    res.json({ faq });
  } catch (error: any) {
    console.error("Error fetching FAQ:", error);
    res.status(500).json({ error: "Failed to fetch FAQ" });
  }
});

// Create a new FAQ (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const validatedData = createFaqSchema.parse(req.body);
    const faq = await storage.createFaq(validatedData);
    
    res.status(201).json({ faq });
  } catch (error: any) {
    console.error("Error creating FAQ:", error);
    res.status(400).json({ error: error.message || "Failed to create FAQ" });
  }
});

// Update a FAQ (admin only)
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const validatedData = updateFaqSchema.parse(req.body);
    const faq = await storage.updateFaq(req.params.id, validatedData);
    
    if (!faq) {
      return res.status(404).json({ error: "FAQ not found" });
    }
    
    res.json({ faq });
  } catch (error: any) {
    console.error("Error updating FAQ:", error);
    res.status(400).json({ error: error.message || "Failed to update FAQ" });
  }
});

// Delete a FAQ (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const success = await storage.deleteFaq(req.params.id);
    
    if (!success) {
      return res.status(404).json({ error: "FAQ not found" });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({ error: "Failed to delete FAQ" });
  }
});

export default router;
