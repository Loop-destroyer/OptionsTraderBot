import { nseApiService } from "./nseApi";
import type { CandleData, BreakoutAnalysis, TrailingStopLoss, SmartSuggestion } from "@shared/schema";

interface IronCondorMetrics {
  maxProfit: number;
  maxLoss: number;
  riskReward: number;
  lowerBreakeven: number;
  upperBreakeven: number;
  probability: number;
}

export class IronCondorEngine {
  async analyzeBreakout(underlying: string): Promise<BreakoutAnalysis> {
    try {
      const candleData = await nseApiService.getCandleStickData(underlying, "15m", 4);
      
      if (candleData.length < 4) {
        throw new Error("Insufficient candle data for analysis");
      }

      // Calculate percentage changes for each candle
      const changes = candleData.map((candle, index) => {
        if (index === 0) return 0;
        const prevClose = candleData[index - 1].close;
        return ((candle.close - prevClose) / prevClose) * 100;
      });

      // Determine trend strength and direction
      const totalChange = changes.reduce((sum, change) => sum + change, 0);
      const positiveCandles = changes.filter(change => change > 0).length;
      const negativeCandles = changes.filter(change => change < 0).length;

      let trend = "NEUTRAL";
      let strength = 0;

      if (positiveCandles >= 3) {
        trend = "BULLISH";
        strength = Math.min(100, Math.abs(totalChange) * 20);
      } else if (negativeCandles >= 3) {
        trend = "BEARISH";
        strength = Math.min(100, Math.abs(totalChange) * 20);
      } else {
        strength = Math.abs(totalChange) * 10;
      }

      return {
        candle1: changes[1] || 0,
        candle2: changes[2] || 0,
        candle3: changes[3] || 0,
        candle4: changes[0] || 0, // Most recent candle
        trend,
        strength: Math.round(strength),
      };
    } catch (error) {
      console.error("Error analyzing breakout:", error);
      throw new Error("Failed to analyze breakout patterns");
    }
  }

  calculateIronCondorMetrics(
    putBuyStrike: number,
    putSellStrike: number,
    callSellStrike: number,
    callBuyStrike: number,
    putBuyPrice: number,
    putSellPrice: number,
    callSellPrice: number,
    callBuyPrice: number
  ): IronCondorMetrics {
    // Iron Condor: Sell Put + Buy Put (lower strikes) + Sell Call + Buy Call (higher strikes)
    const netCredit = (putSellPrice + callSellPrice) - (putBuyPrice + callBuyPrice);
    const putSpread = putSellStrike - putBuyStrike;
    const callSpread = callBuyStrike - callSellStrike;
    const maxSpread = Math.max(putSpread, callSpread);

    const maxProfit = netCredit;
    const maxLoss = maxSpread - netCredit;
    const riskReward = maxLoss > 0 ? maxProfit / maxLoss : 0;

    const lowerBreakeven = putSellStrike - netCredit;
    const upperBreakeven = callSellStrike + netCredit;

    // Calculate probability based on the range between breakevens
    const profitZone = upperBreakeven - lowerBreakeven;
    const totalRange = callBuyStrike - putBuyStrike;
    const probability = Math.round((profitZone / totalRange) * 100);

    return {
      maxProfit,
      maxLoss,
      riskReward,
      lowerBreakeven,
      upperBreakeven,
      probability: Math.max(0, Math.min(100, probability)),
    };
  }

  async generateSmartSuggestions(underlying: string, expiry: string): Promise<SmartSuggestion[]> {
    try {
      const optionsChain = await nseApiService.getOptionsChain(underlying, expiry);
      const marketData = await nseApiService.getMarketData(underlying);
      const suggestions: SmartSuggestion[] = [];

      if (optionsChain.length < 5) {
        throw new Error("Insufficient options data for suggestions");
      }

      const spotPrice = marketData.spotPrice;
      const atmIndex = optionsChain.findIndex(option => option.strike >= spotPrice);

      // Conservative Strategy - Wider spreads, higher probability
      if (atmIndex >= 2 && atmIndex < optionsChain.length - 2) {
        const putBuy = optionsChain[atmIndex - 2];
        const putSell = optionsChain[atmIndex - 1];
        const callSell = optionsChain[atmIndex + 1];
        const callBuy = optionsChain[atmIndex + 2];

        const metrics = this.calculateIronCondorMetrics(
          putBuy.strike, putSell.strike, callSell.strike, callBuy.strike,
          putBuy.peLtp, putSell.peLtp, callSell.ceLtp, callBuy.ceLtp
        );

        suggestions.push({
          id: 0,
          underlying,
          expiry,
          putBuyStrike: putBuy.strike,
          putSellStrike: putSell.strike,
          callSellStrike: callSell.strike,
          callBuyStrike: callBuy.strike,
          riskReward: metrics.riskReward.toString(),
          successProbability: Math.max(85, metrics.probability),
          maxProfit: metrics.maxProfit.toString(),
          maxLoss: metrics.maxLoss.toString(),
          strategy: "CONSERVATIVE",
          createdAt: new Date(),
        });
      }

      // Moderate Strategy - Balanced risk-reward
      if (atmIndex >= 1 && atmIndex < optionsChain.length - 1) {
        const putBuy = optionsChain[atmIndex - 1];
        const putSell = optionsChain[atmIndex];
        const callSell = optionsChain[atmIndex];
        const callBuy = optionsChain[atmIndex + 1];

        const metrics = this.calculateIronCondorMetrics(
          putBuy.strike, putSell.strike, callSell.strike, callBuy.strike,
          putBuy.peLtp, putSell.peLtp, callSell.ceLtp, callBuy.ceLtp
        );

        suggestions.push({
          id: 0,
          underlying,
          expiry,
          putBuyStrike: putBuy.strike,
          putSellStrike: putSell.strike,
          callSellStrike: callSell.strike,
          callBuyStrike: callBuy.strike,
          riskReward: metrics.riskReward.toString(),
          successProbability: Math.max(70, metrics.probability - 10),
          maxProfit: metrics.maxProfit.toString(),
          maxLoss: metrics.maxLoss.toString(),
          strategy: "MODERATE",
          createdAt: new Date(),
        });
      }

      // Aggressive Strategy - Tighter spreads, higher risk-reward
      if (atmIndex >= 1 && atmIndex < optionsChain.length - 1) {
        const putBuy = optionsChain[atmIndex];
        const putSell = optionsChain[atmIndex];
        const callSell = optionsChain[atmIndex];
        const callBuy = optionsChain[atmIndex];

        // Create tighter spreads by using closer strikes
        const tightPutBuy = optionsChain[Math.max(0, atmIndex - 1)];
        const tightCallBuy = optionsChain[Math.min(optionsChain.length - 1, atmIndex + 1)];

        const metrics = this.calculateIronCondorMetrics(
          tightPutBuy.strike, putSell.strike, callSell.strike, tightCallBuy.strike,
          tightPutBuy.peLtp, putSell.peLtp, callSell.ceLtp, tightCallBuy.ceLtp
        );

        suggestions.push({
          id: 0,
          underlying,
          expiry,
          putBuyStrike: tightPutBuy.strike,
          putSellStrike: putSell.strike,
          callSellStrike: callSell.strike,
          callBuyStrike: tightCallBuy.strike,
          riskReward: metrics.riskReward.toString(),
          successProbability: Math.max(55, metrics.probability - 20),
          maxProfit: metrics.maxProfit.toString(),
          maxLoss: metrics.maxLoss.toString(),
          strategy: "AGGRESSIVE",
          createdAt: new Date(),
        });
      }

      return suggestions.sort((a, b) => b.successProbability - a.successProbability);
    } catch (error) {
      console.error("Error generating smart suggestions:", error);
      throw new Error("Failed to generate smart suggestions");
    }
  }

  calculateTrailingStopLoss(
    currentPL: number,
    maxProfit: number,
    trailPercent: number = 30
  ): TrailingStopLoss {
    const currentPLPercent = (currentPL / maxProfit) * 100;
    const trailLevel = Math.max(0, currentPL * (1 - trailPercent / 100));
    const trailLevelPercent = (trailLevel / maxProfit) * 100;

    let status = "MONITORING";
    if (currentPLPercent >= 80) {
      status = "TRAILING_ACTIVE";
    } else if (currentPLPercent <= trailLevelPercent) {
      status = "EXIT_SIGNAL";
    }

    return {
      currentPL,
      currentPLPercent: Math.round(currentPLPercent * 100) / 100,
      trailLevel,
      trailLevelPercent: Math.round(trailLevelPercent * 100) / 100,
      status,
    };
  }
}

export const ironCondorEngine = new IronCondorEngine();
