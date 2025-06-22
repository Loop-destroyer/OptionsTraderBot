import { 
  ironCondorPositions, 
  optionsChain, 
  tradingSignals, 
  smartSuggestions, 
  marketData,
  type IronCondorPosition, 
  type InsertIronCondorPosition,
  type OptionsChainData,
  type InsertOptionsChainData,
  type TradingSignal,
  type InsertTradingSignal,
  type SmartSuggestion,
  type InsertSmartSuggestion,
  type MarketData,
  type InsertMarketData
} from "@shared/schema";

export interface IStorage {
  // Iron Condor Position methods
  getActiveIronCondor(): Promise<IronCondorPosition | undefined>;
  createIronCondorPosition(position: InsertIronCondorPosition): Promise<IronCondorPosition>;
  updateIronCondorStatus(id: number, status: string): Promise<IronCondorPosition | undefined>;
  
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
}

export class MemStorage implements IStorage {
  private ironCondorPositions: Map<number, IronCondorPosition>;
  private optionsChainData: Map<string, OptionsChainData[]>;
  private tradingSignals: Map<string, TradingSignal[]>;
  private smartSuggestions: Map<string, SmartSuggestion[]>;
  private marketData: Map<string, MarketData>;
  private currentId: number;

  constructor() {
    this.ironCondorPositions = new Map();
    this.optionsChainData = new Map();
    this.tradingSignals = new Map();
    this.smartSuggestions = new Map();
    this.marketData = new Map();
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
      netPremium: "4250.00",
      maxProfit: "4250.00",
      maxLoss: "15750.00",
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
}

export const storage = new MemStorage();
