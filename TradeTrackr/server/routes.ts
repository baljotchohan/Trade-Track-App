import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTradeSchema, updateTradeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Trading stats endpoint
  app.get('/api/trading/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getTradingStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching trading stats:", error);
      res.status(500).json({ message: "Failed to fetch trading stats" });
    }
  });

  // Get trades endpoint
  app.get('/api/trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const trades = await storage.getTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Create trade endpoint
  app.post('/api/trades', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedTrade = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade(userId, validatedTrade);
      res.status(201).json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid trade data", errors: error });
      } else {
        res.status(500).json({ message: "Failed to create trade" });
      }
    }
  });

  // Update trade endpoint
  app.patch('/api/trades/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tradeId = req.params.id;
      const validatedUpdate = updateTradeSchema.parse(req.body);
      const trade = await storage.updateTrade(tradeId, userId, validatedUpdate);
      res.json(trade);
    } catch (error) {
      console.error("Error updating trade:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid trade data", errors: error });
      } else {
        res.status(500).json({ message: "Failed to update trade" });
      }
    }
  });

  // Delete trade endpoint
  app.delete('/api/trades/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tradeId = req.params.id;
      await storage.deleteTrade(tradeId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Failed to delete trade" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
