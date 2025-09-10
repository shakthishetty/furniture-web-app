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
