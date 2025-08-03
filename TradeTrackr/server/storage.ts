import {
  users,
  trades,
  type User,
  type UpsertUser,
  type Trade,
  type InsertTrade,
  type UpdateTrade,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Trade operations
  getTrades(userId: string, limit?: number): Promise<Trade[]>;
  getTradesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Trade[]>;
  createTrade(userId: string, trade: InsertTrade): Promise<Trade>;
  updateTrade(tradeId: string, userId: string, trade: UpdateTrade): Promise<Trade>;
  deleteTrade(tradeId: string, userId: string): Promise<void>;
  getTradingStats(userId: string): Promise<{
    todayTrades: number;
    yesterdayTrades: number;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Trade operations
  async getTrades(userId: string, limit = 10): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(limit);
  }

  async getTradesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(
        and(
          eq(trades.userId, userId),
          gte(trades.createdAt, startDate),
          lte(trades.createdAt, endDate)
        )
      )
      .orderBy(desc(trades.createdAt));
  }

  async createTrade(userId: string, trade: InsertTrade): Promise<Trade> {
    // Calculate P&L if both entry and exit prices are provided
    let pnl = null;
    if (trade.exitPrice && trade.entryPrice) {
      const entryPrice = parseFloat(trade.entryPrice.toString());
      const exitPrice = parseFloat(trade.exitPrice.toString());
      const quantity = trade.quantity;
      
      if (trade.type === 'long') {
        pnl = ((exitPrice - entryPrice) * quantity).toString();
      } else {
        pnl = ((entryPrice - exitPrice) * quantity).toString();
      }
    }

    const [newTrade] = await db
      .insert(trades)
      .values({
        ...trade,
        userId,
        pnl,
        status: trade.exitPrice ? 'closed' : 'open',
        exitTime: trade.exitPrice ? new Date() : null,
      })
      .returning();

    return newTrade;
  }

  async updateTrade(tradeId: string, userId: string, trade: UpdateTrade): Promise<Trade> {
    // Calculate P&L if both entry and exit prices are provided
    let updateData = { ...trade };
    if (trade.exitPrice && trade.entryPrice) {
      const entryPrice = parseFloat(trade.entryPrice.toString());
      const exitPrice = parseFloat(trade.exitPrice.toString());
      const quantity = trade.quantity || 0;
      
      if (trade.type === 'long') {
        updateData.pnl = ((exitPrice - entryPrice) * quantity).toString();
      } else {
        updateData.pnl = ((entryPrice - exitPrice) * quantity).toString();
      }
      updateData.status = 'closed';
      updateData.exitTime = new Date();
    }

    const [updatedTrade] = await db
      .update(trades)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
      .returning();

    return updatedTrade;
  }

  async deleteTrade(tradeId: string, userId: string): Promise<void> {
    await db
      .delete(trades)
      .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)));
  }

  async getTradingStats(userId: string): Promise<{
    todayTrades: number;
    yesterdayTrades: number;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's trades count
    const [todayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(
        and(
          eq(trades.userId, userId),
          gte(trades.createdAt, today),
          lte(trades.createdAt, tomorrow)
        )
      );

    // Get yesterday's trades count
    const [yesterdayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(
        and(
          eq(trades.userId, userId),
          gte(trades.createdAt, yesterday),
          lte(trades.createdAt, today)
        )
      );

    // Get total trades count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(eq(trades.userId, userId));

    // Get win rate and total P&L
    const closedTrades = await db
      .select()
      .from(trades)
      .where(
        and(
          eq(trades.userId, userId),
          eq(trades.status, 'closed')
        )
      );

    const winningTrades = closedTrades.filter(trade => 
      trade.pnl && parseFloat(trade.pnl.toString()) > 0
    );

    const winRate = closedTrades.length > 0 ? 
      (winningTrades.length / closedTrades.length) * 100 : 0;

    const totalPnL = closedTrades.reduce((sum, trade) => 
      sum + (trade.pnl ? parseFloat(trade.pnl.toString()) : 0), 0
    );

    return {
      todayTrades: Number(todayResult?.count || 0),
      yesterdayTrades: Number(yesterdayResult?.count || 0),
      totalTrades: Number(totalResult?.count || 0),
      winRate: Math.round(winRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
    };
  }
}

export const storage = new DatabaseStorage();
