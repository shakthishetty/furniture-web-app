import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./auth-routes";
import googleAuthRoutes from "./google-auth";
import configuratorRoutes from "./configurator-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.use('/api/auth', authRoutes);
  app.use('/api/auth', googleAuthRoutes);
  
  // Product Configurator routes
  app.use('/api/configurator', configuratorRoutes);

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
