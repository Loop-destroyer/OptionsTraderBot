import { 
  ironCondorPositions, 
  optionsChain, 
  tradingSignals, 
  smartSuggestions, 
  marketData,
  userCapital,
  type IronCondorPosition, 
  type InsertIronCondorPosition,
  type OptionsChainData,
  type InsertOptionsChainData,
  type TradingSignal,
  type InsertTradingSignal,
  type SmartSuggestion,
  type InsertSmartSuggestion,
  type MarketData,
  type InsertMarketData,
  type UserCapital,
  type InsertUserCapital
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  // Iron Condor Position methods
  getActiveIronCondor(): Promise<IronCondorPosition | undefined>;
  createIronCondorPosition(position: InsertIronCondorPosition): Promise<IronCondorPosition>;
  updateIronCondorStatus(id: number, status: string): Promise<IronCondorPosition | undefined>;
  updateIronCondorPL(id: number, currentPL: number): Promise<IronCondorPosition | undefined>;
  
  // Options Chain methods
  getOptionsChain(underlying: string, expiry: string): Promise<OptionsChainData[]>;
  updateOptionsChain(data: InsertOptionsChainData[]): Promise<OptionsChainData[]>;
  
  // Trading Signals methods
  getLatestTradingSignal(underlying: string): Promise<TradingSignal | undefined>;
  createTradingSignal(signal: InsertTradingSignal): Promise<TradingSignal>;
  
  // Smart Suggestions methods
  getSmartSuggestions(underlying: string, strategy?: string): Promise<SmartSuggestion[]>;
  createSmartSuggestion(suggestion: InsertSmartSuggestion): Promise<SmartSuggestion>;
  
  // Market Data methods
  getMarketData(underlying: string): Promise<MarketData | undefined>;
  updateMarketData(data: InsertMarketData): Promise<MarketData>;
  
  // User Capital methods
  getUserCapital(): Promise<UserCapital | undefined>;
  updateUserCapital(data: InsertUserCapital): Promise<UserCapital>;
  
  // Backtesting methods
  runBacktest(config: any): Promise<any>;
  getBacktestResults(strategy?: string): Promise<any[]>;
  seedHistoricalData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private ironCondorPositions: Map<number, IronCondorPosition>;
  private optionsChainData: Map<string, OptionsChainData[]>;
  private tradingSignals: Map<string, TradingSignal[]>;
  private smartSuggestions: Map<string, SmartSuggestion[]>;
  private marketData: Map<string, MarketData>;
  private userCapital: UserCapital | undefined;
  private currentId: number;

  constructor() {
    this.ironCondorPositions = new Map();
    this.optionsChainData = new Map();
    this.tradingSignals = new Map();
    this.smartSuggestions = new Map();
    this.marketData = new Map();
    this.userCapital = undefined;
    this.currentId = 1;
    
    // Initialize with sample data for NIFTY
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample iron condor position
    const samplePosition: IronCondorPosition = {
      id: this.currentId++,
      underlying: "NIFTY",
      expiry: "28 DEC 2023",
      putBuyStrike: 21000,
      putSellStrike: 21200,
      callSellStrike: 21800,
      callBuyStrike: 22000,
      putBuyPrice: "45.50",
      putSellPrice: "125.75",
      callSellPrice: "85.60",
      callBuyPrice: "35.75",
      netPremium: "130.10",
      maxProfit: "130.10",
      maxLoss: "69.90",
      capital: "100000.00",
      quantity: 50,
      currentPL: "2150.00",
      status: "ACTIVE",
      createdAt: new Date(),
    };
    this.ironCondorPositions.set(samplePosition.id, samplePosition);

    // Sample market data
    const sampleMarketData: MarketData = {
      id: this.currentId++,
      underlying: "NIFTY",
      spotPrice: "21542.35",
      change: "171.85",
      changePercent: "0.8",
      marketStatus: "OPEN",
      lastUpdated: new Date(),
    };
    this.marketData.set("NIFTY", sampleMarketData);

    // Sample user capital
    this.userCapital = {
      id: this.currentId++,
      totalCapital: "500000.00",
      availableCapital: "400000.00",
      usedCapital: "100000.00",
      lastUpdated: new Date(),
    };

    // Sample options chain data
    const sampleOptionsChain: OptionsChainData[] = [
      { id: this.currentId++, underlying: "NIFTY", expiry: "28 DEC 2023", strike: 21000, peLtp: "45.50", ceLtp: "580.25", peVolume: 120000, ceVolume: 85000, lastUpdated: new Date() },
      { id: this.currentId++, underlying: "NIFTY", expiry: "28 DEC 2023", strike: 21200, peLtp: "125.75", ceLtp: "425.80", peVolume: 250000, ceVolume: 180000, lastUpdated: new Date() },
      { id: this.currentId++, underlying: "NIFTY", expiry: "28 DEC 2023", strike: 21500, peLtp: "285.50", ceLtp: "220.25", peVolume: 380000, ceVolume: 320000, lastUpdated: new Date() },
      { id: this.currentId++, underlying: "NIFTY", expiry: "28 DEC 2023", strike: 21800, peLtp: "485.75", ceLtp: "85.60", peVolume: 190000, ceVolume: 150000, lastUpdated: new Date() },
      { id: this.currentId++, underlying: "NIFTY", expiry: "28 DEC 2023", strike: 22000, peLtp: "625.25", ceLtp: "35.75", peVolume: 80000, ceVolume: 65000, lastUpdated: new Date() },
    ];
    this.optionsChainData.set("NIFTY:28 DEC 2023", sampleOptionsChain);
  }

  async getActiveIronCondor(): Promise<IronCondorPosition | undefined> {
    return Array.from(this.ironCondorPositions.values()).find(p => p.status === "ACTIVE");
  }

  async createIronCondorPosition(position: InsertIronCondorPosition): Promise<IronCondorPosition> {
    const id = this.currentId++;
    const newPosition: IronCondorPosition = {
      ...position,
      id,
      status: position.status || "ACTIVE",
      quantity: position.quantity || 1,
      currentPL: "0.00",
      createdAt: new Date(),
    };
    this.ironCondorPositions.set(id, newPosition);
    return newPosition;
  }

  async updateIronCondorStatus(id: number, status: string): Promise<IronCondorPosition | undefined> {
    const position = this.ironCondorPositions.get(id);
    if (position) {
      position.status = status;
      this.ironCondorPositions.set(id, position);
      return position;
    }
    return undefined;
  }

  async updateIronCondorPL(id: number, currentPL: number): Promise<IronCondorPosition | undefined> {
    const position = this.ironCondorPositions.get(id);
    if (position) {
      position.currentPL = currentPL.toString();
      this.ironCondorPositions.set(id, position);
      return position;
    }
    return undefined;
  }

  async getOptionsChain(underlying: string, expiry: string): Promise<OptionsChainData[]> {
    const key = `${underlying}:${expiry}`;
    return this.optionsChainData.get(key) || [];
  }

  async updateOptionsChain(data: InsertOptionsChainData[]): Promise<OptionsChainData[]> {
    const result: OptionsChainData[] = [];
    for (const item of data) {
      const id = this.currentId++;
      const chainData: OptionsChainData = {
        ...item,
        id,
        peLtp: item.peLtp || null,
        ceLtp: item.ceLtp || null,
        peVolume: item.peVolume || null,
        ceVolume: item.ceVolume || null,
        lastUpdated: new Date(),
      };
      result.push(chainData);
    }
    
    if (result.length > 0) {
      const key = `${result[0].underlying}:${result[0].expiry}`;
      this.optionsChainData.set(key, result);
    }
    
    return result;
  }

  async getLatestTradingSignal(underlying: string): Promise<TradingSignal | undefined> {
    const signals = this.tradingSignals.get(underlying) || [];
    return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }

  async createTradingSignal(signal: InsertTradingSignal): Promise<TradingSignal> {
    const id = this.currentId++;
    const newSignal: TradingSignal = {
      ...signal,
      id,
      timestamp: new Date(),
    };
    
    const signals = this.tradingSignals.get(signal.underlying) || [];
    signals.push(newSignal);
    this.tradingSignals.set(signal.underlying, signals);
    
    return newSignal;
  }

  async getSmartSuggestions(underlying: string, strategy?: string): Promise<SmartSuggestion[]> {
    const suggestions = this.smartSuggestions.get(underlying) || [];
    if (strategy) {
      return suggestions.filter(s => s.strategy === strategy);
    }
    return suggestions;
  }

  async createSmartSuggestion(suggestion: InsertSmartSuggestion): Promise<SmartSuggestion> {
    const id = this.currentId++;
    const newSuggestion: SmartSuggestion = {
      ...suggestion,
      id,
      createdAt: new Date(),
    };
    
    const suggestions = this.smartSuggestions.get(suggestion.underlying) || [];
    suggestions.push(newSuggestion);
    this.smartSuggestions.set(suggestion.underlying, suggestions);
    
    return newSuggestion;
  }

  async getMarketData(underlying: string): Promise<MarketData | undefined> {
    return this.marketData.get(underlying);
  }

  async updateMarketData(data: InsertMarketData): Promise<MarketData> {
    const id = this.currentId++;
    const newData: MarketData = {
      ...data,
      id,
      lastUpdated: new Date(),
    };
    this.marketData.set(data.underlying, newData);
    return newData;
  }

  async runBacktest(config: any): Promise<any> {
    throw new Error("Backtesting not implemented for MemStorage");
  }

  async getBacktestResults(strategy?: string): Promise<any[]> {
    return [];
  }

  async seedHistoricalData(): Promise<void> {
    // Mock implementation for MemStorage
  }

  async getUserCapital(): Promise<UserCapital | undefined> {
    return this.userCapital;
  }

  async updateUserCapital(data: InsertUserCapital): Promise<UserCapital> {
    const id = this.userCapital?.id || this.currentId++;
    const newCapital: UserCapital = {
      ...data,
      id,
      usedCapital: data.usedCapital || "0.00",
      lastUpdated: new Date(),
    };
    this.userCapital = newCapital;
    return newCapital;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getActiveIronCondor(): Promise<IronCondorPosition | undefined> {
    const [position] = await db.select().from(ironCondorPositions).where(eq(ironCondorPositions.status, "ACTIVE"));
    return position || undefined;
  }

  async createIronCondorPosition(position: InsertIronCondorPosition): Promise<IronCondorPosition> {
    const [newPosition] = await db
      .insert(ironCondorPositions)
      .values({
        ...position,
        status: position.status || "ACTIVE",
        quantity: position.quantity || 1,
        currentPL: "0.00",
      })
      .returning();
    return newPosition;
  }

  async updateIronCondorStatus(id: number, status: string): Promise<IronCondorPosition | undefined> {
    const [position] = await db
      .update(ironCondorPositions)
      .set({ status })
      .where(eq(ironCondorPositions.id, id))
      .returning();
    return position || undefined;
  }

  async updateIronCondorPL(id: number, currentPL: number): Promise<IronCondorPosition | undefined> {
    const [position] = await db
      .update(ironCondorPositions)
      .set({ currentPL: currentPL.toString() })
      .where(eq(ironCondorPositions.id, id))
      .returning();
    return position || undefined;
  }

  async getOptionsChain(underlying: string, expiry: string): Promise<OptionsChainData[]> {
    return await db.select().from(optionsChain)
      .where(and(
        eq(optionsChain.underlying, underlying),
        eq(optionsChain.expiry, expiry)
      ));
  }

  async updateOptionsChain(data: InsertOptionsChainData[]): Promise<OptionsChainData[]> {
    // Clear existing data and insert fresh data
    await db.delete(optionsChain)
      .where(and(
        eq(optionsChain.underlying, data[0]?.underlying || "NIFTY"),
        eq(optionsChain.expiry, data[0]?.expiry || "28 DEC 2023")
      ));

    const results = await db
      .insert(optionsChain)
      .values(data.map(item => ({
        ...item,
        peLtp: item.peLtp || null,
        ceLtp: item.ceLtp || null,
        peVolume: item.peVolume || null,
        ceVolume: item.ceVolume || null,
      })))
      .returning();
    
    return results;
  }

  async getLatestTradingSignal(underlying: string): Promise<TradingSignal | undefined> {
    const [signal] = await db.select().from(tradingSignals)
      .where(eq(tradingSignals.underlying, underlying))
      .orderBy(sql`${tradingSignals.timestamp} DESC`)
      .limit(1);
    return signal || undefined;
  }

  async createTradingSignal(signal: InsertTradingSignal): Promise<TradingSignal> {
    const [newSignal] = await db
      .insert(tradingSignals)
      .values(signal)
      .returning();
    return newSignal;
  }

  async getSmartSuggestions(underlying: string, strategy?: string): Promise<SmartSuggestion[]> {
    if (strategy) {
      return await db.select().from(smartSuggestions)
        .where(and(
          eq(smartSuggestions.underlying, underlying),
          eq(smartSuggestions.strategy, strategy)
        ))
        .orderBy(sql`${smartSuggestions.successProbability} DESC`);
    }
    
    return await db.select().from(smartSuggestions)
      .where(eq(smartSuggestions.underlying, underlying))
      .orderBy(sql`${smartSuggestions.successProbability} DESC`);
  }

  async createSmartSuggestion(suggestion: InsertSmartSuggestion): Promise<SmartSuggestion> {
    const [newSuggestion] = await db
      .insert(smartSuggestions)
      .values(suggestion)
      .returning();
    return newSuggestion;
  }

  async getMarketData(underlying: string): Promise<MarketData | undefined> {
    const [data] = await db.select().from(marketData)
      .where(eq(marketData.underlying, underlying))
      .orderBy(sql`${marketData.lastUpdated} DESC`)
      .limit(1);
    return data || undefined;
  }

  async updateMarketData(data: InsertMarketData): Promise<MarketData> {
    // Clear existing data for this underlying and insert fresh data
    await db.delete(marketData).where(eq(marketData.underlying, data.underlying));
    
    const [newData] = await db
      .insert(marketData)
      .values(data)
      .returning();
    
    return newData;
  }

  async getUserCapital(): Promise<UserCapital | undefined> {
    const [capital] = await db.select().from(userCapital)
      .orderBy(sql`${userCapital.lastUpdated} DESC`)
      .limit(1);
    return capital || undefined;
  }

  async updateUserCapital(data: InsertUserCapital): Promise<UserCapital> {
    const [newCapital] = await db
      .insert(userCapital)
      .values({
        ...data,
        usedCapital: data.usedCapital || "0.00",
      })
      .onConflictDoUpdate({
        target: [userCapital.id],
        set: {
          totalCapital: sql`excluded.total_capital`,
          availableCapital: sql`excluded.available_capital`,
          usedCapital: sql`excluded.used_capital`,
          lastUpdated: sql`NOW()`,
        },
      })
      .returning();
    return newCapital;
  }

  async runBacktest(config: any): Promise<any> {
    const { backtestEngine } = await import("./services/backtestEngine");
    const results = await backtestEngine.runBacktest(config);
    await backtestEngine.saveBacktestResults(results);
    return results;
  }

  async getBacktestResults(strategy?: string): Promise<any[]> {
    const { backtestEngine } = await import("./services/backtestEngine");
    return await backtestEngine.getBacktestResults(strategy);
  }

  async seedHistoricalData(): Promise<void> {
    const { backtestEngine } = await import("./services/backtestEngine");
    await backtestEngine.seedHistoricalData();
  }
}

export const storage = new DatabaseStorage();
