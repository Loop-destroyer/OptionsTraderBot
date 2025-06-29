import { db } from "../db";
import { historicalData, backtestResults, type HistoricalData, type InsertBacktestResults } from "@shared/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { ironCondorEngine } from "./ironCondorEngine";

interface BacktestConfig {
  underlying: string;
  startDate: Date;
  endDate: Date;
  strategy: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  initialCapital: number;
  riskPerTrade: number; // Percentage of capital to risk per trade
}

interface TradeResult {
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  pl: number;
  plPercent: number;
  maxProfit: number;
  maxLoss: number;
  signal: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
}

export class BacktestEngine {
  async loadHistoricalData(underlying: string, startDate: Date, endDate: Date): Promise<HistoricalData[]> {
    return await db.select().from(historicalData)
      .where(
        and(
          eq(historicalData.underlying, underlying),
          gte(historicalData.date, startDate),
          lte(historicalData.date, endDate)
        )
      )
      .orderBy(historicalData.date);
  }

  async seedHistoricalData(underlying: string = "NIFTY"): Promise<void> {
    // Generate comprehensive historical data covering multiple years
    const endDate = new Date('2024-12-31');
    const startDate = new Date('2022-01-01');

    const data: any[] = [];
    let currentPrice = 18000; // Starting NIFTY price for 2022
    const currentDate = new Date(startDate);

    console.log(`Seeding comprehensive ${underlying} data from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Generate realistic price movements with market cycles
        const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const seasonalFactor = 1 + 0.1 * Math.sin(2 * Math.PI * dayOfYear / 365);
        
        const volatility = 0.012 * seasonalFactor; // Variable volatility
        const trend = 0.0003; // Long-term upward trend
        const randomChange = (Math.random() - 0.5) * 2 * volatility + trend;
        
        const open = currentPrice;
        const close = Math.max(100, open * (1 + randomChange)); // Ensure positive prices
        const high = Math.max(open, close) * (1 + Math.random() * 0.008);
        const low = Math.min(open, close) * (1 - Math.random() * 0.008);
        const volume = Math.floor(Math.random() * 800000) + 400000;

        data.push({
          underlying,
          date: new Date(currentDate),
          open: open.toFixed(2),
          high: high.toFixed(2),
          low: low.toFixed(2),
          close: close.toFixed(2),
          volume,
        });

        currentPrice = close;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Generated ${data.length} comprehensive data points`);

    // Clear existing data first
    await db.delete(historicalData).where(eq(historicalData.underlying, underlying));

    // Insert in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await db.insert(historicalData).values(batch);
    }
    
    console.log("Comprehensive historical data seeded successfully");
  }

  private analyzeBreakoutFromData(dataSlice: HistoricalData[]): { trend: string; strength: number; confidence: number } {
    if (dataSlice.length < 4) {
      return { trend: "NEUTRAL", strength: 0, confidence: 50 };
    }

    // Apply the new wick-based breakout logic
    const thirdCandle = dataSlice[2]; // 3rd candle defines limits
    const fourthCandle = dataSlice[3]; // 4th candle for breakout check
    
    const upperWick = parseFloat(thirdCandle.high);
    const lowerWick = parseFloat(thirdCandle.low);
    const currentPrice = parseFloat(fourthCandle.close);
    
    let trend = "NEUTRAL";
    let strength = 0;
    let confidence = 50;

    // Check for breakout above upper wick (bullish)
    if (currentPrice > upperWick) {
      trend = "BULLISH";
      const breakoutDistance = ((currentPrice - upperWick) / upperWick) * 100;
      strength = Math.min(100, Math.max(60, breakoutDistance * 50));
      confidence = Math.min(95, 70 + strength / 4);
    }
    // Check for breakout below lower wick (bearish)
    else if (currentPrice < lowerWick) {
      trend = "BEARISH";
      const breakoutDistance = ((lowerWick - currentPrice) / lowerWick) * 100;
      strength = Math.min(100, Math.max(60, breakoutDistance * 50));
      confidence = Math.min(95, 70 + strength / 4);
    }
    // No breakout - price within wicks
    else {
      const wickRange = upperWick - lowerWick;
      const pricePosition = (currentPrice - lowerWick) / wickRange;
      
      if (pricePosition > 0.7) {
        trend = "BULLISH";
        strength = 40;
        confidence = 55;
      } else if (pricePosition < 0.3) {
        trend = "BEARISH";
        strength = 40;
        confidence = 55;
      } else {
        trend = "NEUTRAL";
        strength = 20;
        confidence = 45;
      }
    }

    return { trend, strength: Math.round(strength), confidence: Math.round(confidence) };
  }

  private calculateIronCondorPL(
    spotPrice: number,
    putBuyStrike: number,
    putSellStrike: number,
    callSellStrike: number,
    callBuyStrike: number,
    netPremium: number
  ): number {
    let pl = netPremium;

    // PUT spread
    if (spotPrice <= putBuyStrike) {
      pl -= (putSellStrike - putBuyStrike);
    } else if (spotPrice < putSellStrike) {
      pl -= (putSellStrike - spotPrice);
    }

    // CALL spread
    if (spotPrice >= callBuyStrike) {
      pl -= (callBuyStrike - callSellStrike);
    } else if (spotPrice > callSellStrike) {
      pl -= (spotPrice - callSellStrike);
    }

    return pl;
  }

  async runBacktest(config: BacktestConfig): Promise<InsertBacktestResults> {
    console.log(`Starting backtest for ${config.underlying} from ${config.startDate.toDateString()} to ${config.endDate.toDateString()}`);
    
    const historicalPrices = await this.loadHistoricalData(config.underlying, config.startDate, config.endDate);
    
    if (historicalPrices.length < 10) {
      console.log(`Only ${historicalPrices.length} historical data points available, proceeding with limited dataset`);
    }

    const trades: TradeResult[] = [];
    let currentCapital = config.initialCapital;
    let maxCapital = config.initialCapital;
    let maxDrawdown = 0;

    // Backtest parameters based on strategy
    const strategyParams = {
      CONSERVATIVE: { riskReward: 0.3, minConfidence: 75, strikeWidth: 400 },
      MODERATE: { riskReward: 0.5, minConfidence: 65, strikeWidth: 300 },
      AGGRESSIVE: { riskReward: 0.8, minConfidence: 55, strikeWidth: 200 },
    };

    const params = strategyParams[config.strategy];

    // Simulate trades every 3-5 days
    for (let i = 4; i < historicalPrices.length - 7; i += Math.floor(Math.random() * 3) + 3) {
      const entryDate = new Date(historicalPrices[i].date);
      const entryPrice = parseFloat(historicalPrices[i].close);
      
      // Analyze last 4 candles for signal
      const analysisData = historicalPrices.slice(i - 4, i);
      const analysis = this.analyzeBreakoutFromData(analysisData);
      
      // Only trade if confidence is above threshold
      if (analysis.confidence < params.minConfidence) {
        continue;
      }

      // Setup iron condor strikes
      const strikeWidth = params.strikeWidth;
      const putBuyStrike = Math.round((entryPrice - strikeWidth) / 50) * 50;
      const putSellStrike = Math.round((entryPrice - strikeWidth/2) / 50) * 50;
      const callSellStrike = Math.round((entryPrice + strikeWidth/2) / 50) * 50;
      const callBuyStrike = Math.round((entryPrice + strikeWidth) / 50) * 50;

      // Simulate option prices (simplified)
      const netPremium = strikeWidth * 0.15; // Approximate premium
      const maxProfit = netPremium;
      const maxLoss = strikeWidth - netPremium;

      // Position sizing based on risk
      const riskAmount = currentCapital * (config.riskPerTrade / 100);
      const lotSize = Math.floor(riskAmount / maxLoss);
      
      if (lotSize < 1) continue; // Skip if position too small

      // Find exit (7 days later or when profit/loss targets hit)
      let exitIndex = Math.min(i + 7, historicalPrices.length - 1);
      let exitPrice = parseFloat(historicalPrices[exitIndex].close);
      let currentPL = 0;
      let exitEarly = false;

      // Check daily for exit conditions
      for (let j = i + 1; j <= exitIndex; j++) {
        const dayPrice = parseFloat(historicalPrices[j].close);
        currentPL = this.calculateIronCondorPL(dayPrice, putBuyStrike, putSellStrike, callSellStrike, callBuyStrike, netPremium);
        
        // Exit if 80% of max profit achieved
        if (currentPL >= maxProfit * 0.8) {
          exitIndex = j;
          exitPrice = dayPrice;
          exitEarly = true;
          break;
        }
        
        // Exit if 50% of max loss reached (stop loss)
        if (currentPL <= -maxLoss * 0.5) {
          exitIndex = j;
          exitPrice = dayPrice;
          exitEarly = true;
          break;
        }
      }

      const finalPL = this.calculateIronCondorPL(exitPrice, putBuyStrike, putSellStrike, callSellStrike, callBuyStrike, netPremium);
      const tradePL = finalPL * lotSize;
      const plPercent = (tradePL / (currentCapital * (config.riskPerTrade / 100))) * 100;

      trades.push({
        entryDate,
        exitDate: new Date(historicalPrices[exitIndex].date),
        entryPrice,
        exitPrice,
        pl: tradePL,
        plPercent,
        maxProfit: maxProfit * lotSize,
        maxLoss: maxLoss * lotSize,
        signal: analysis.trend as any,
        confidence: analysis.confidence,
      });

      currentCapital += tradePL;
      maxCapital = Math.max(maxCapital, currentCapital);
      
      const drawdown = ((maxCapital - currentCapital) / maxCapital) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Calculate statistics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pl > 0).length;
    const losingTrades = trades.filter(t => t.pl < 0).length;
    const totalPL = trades.reduce((sum, t) => sum + t.pl, 0);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const wins = trades.filter(t => t.pl > 0).map(t => t.pl);
    const losses = trades.filter(t => t.pl < 0).map(t => t.pl);
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, pl) => sum + pl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, pl) => sum + pl, 0) / losses.length) : 0;
    
    // Simple Sharpe ratio calculation (assuming risk-free rate of 6%)
    const returns = trades.map(t => t.plPercent);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? (avgReturn - 6) / stdDev : 0;

    console.log(`Backtest completed: ${totalTrades} trades, ${winRate.toFixed(1)}% win rate, Total P&L: ₹${totalPL.toFixed(2)}`);

    return {
      strategy: config.strategy,
      startDate: config.startDate,
      endDate: config.endDate,
      totalTrades,
      winningTrades,
      losingTrades,
      totalPL: totalPL.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(2),
      winRate: winRate.toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
    };
  }

  async saveBacktestResults(results: InsertBacktestResults): Promise<void> {
    await db.insert(backtestResults).values(results);
  }

  async getBacktestResults(strategy?: string): Promise<any[]> {
    let query = db.select().from(backtestResults);
    if (strategy) {
      query = query.where(eq(backtestResults.strategy, strategy));
    }
    return await query.orderBy(sql`${backtestResults.createdAt} DESC`);
  }
}

export const backtestEngine = new BacktestEngine();
