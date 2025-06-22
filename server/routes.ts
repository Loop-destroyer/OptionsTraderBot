import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nseApiService } from "./services/nseApi";
import { ironCondorEngine } from "./services/ironCondorEngine";
import { insertIronCondorSchema, insertTradingSignalSchema, insertSmartSuggestionSchema, insertUserCapitalSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Iron Condor Position Routes
  app.get("/api/iron-condor/active", async (req, res) => {
    try {
      const position = await storage.getActiveIronCondor();
      res.json(position);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active iron condor position" });
    }
  });

  app.post("/api/iron-condor", async (req, res) => {
    try {
      const validatedData = insertIronCondorSchema.parse(req.body);
      const position = await storage.createIronCondorPosition(validatedData);
      res.json(position);
    } catch (error) {
      res.status(400).json({ message: "Invalid iron condor data" });
    }
  });

  app.patch("/api/iron-condor/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const position = await storage.updateIronCondorStatus(id, status);
      if (!position) {
        return res.status(404).json({ message: "Iron condor position not found" });
      }
      res.json(position);
    } catch (error) {
      res.status(500).json({ message: "Failed to update iron condor status" });
    }
  });

  // Market Data Routes
  app.get("/api/market-data/:underlying", async (req, res) => {
    try {
      const { underlying } = req.params;
      let marketData = await storage.getMarketData(underlying);
      
      if (!marketData) {
        // Fetch fresh data from NSE API
        const nseData = await nseApiService.getMarketData(underlying);
        marketData = await storage.updateMarketData({
          underlying: nseData.underlying,
          spotPrice: nseData.spotPrice.toString(),
          change: nseData.change.toString(),
          changePercent: nseData.changePercent.toString(),
          marketStatus: nseData.marketStatus,
        });
      }
      
      res.json(marketData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Options Chain Routes
  app.get("/api/options-chain/:underlying/:expiry", async (req, res) => {
    try {
      const { underlying, expiry } = req.params;
      
      // Try to get cached data first
      let optionsChain = await storage.getOptionsChain(underlying, expiry);
      
      if (optionsChain.length === 0) {
        // Fetch fresh data from NSE API
        const nseData = await nseApiService.getOptionsChain(underlying, expiry);
        const chainData = nseData.map(item => ({
          underlying: item.underlying,
          expiry: item.expiry,
          strike: item.strike,
          peLtp: item.peLtp.toString(),
          ceLtp: item.ceLtp.toString(),
          peVolume: item.peVolume,
          ceVolume: item.ceVolume,
        }));
        
        optionsChain = await storage.updateOptionsChain(chainData);
      }
      
      res.json(optionsChain);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch options chain" });
    }
  });

  // Trading Signal Routes
  app.get("/api/trading-signals/:underlying", async (req, res) => {
    try {
      const { underlying } = req.params;
      const signal = await storage.getLatestTradingSignal(underlying);
      res.json(signal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trading signal" });
    }
  });

  app.post("/api/trading-signals/analyze/:underlying", async (req, res) => {
    try {
      const { underlying } = req.params;
      
      // Perform breakout analysis
      const breakoutAnalysis = await ironCondorEngine.analyzeBreakout(underlying);
      
      // Determine signal type based on analysis
      let signalType = "NEUTRAL";
      let confidence = 50;
      
      if (breakoutAnalysis.trend === "BULLISH" && breakoutAnalysis.strength > 60) {
        signalType = "BULLISH";
        confidence = Math.min(95, 60 + breakoutAnalysis.strength / 3);
      } else if (breakoutAnalysis.trend === "BEARISH" && breakoutAnalysis.strength > 60) {
        signalType = "BEARISH";
        confidence = Math.min(95, 60 + breakoutAnalysis.strength / 3);
      }
      
      const signalData = {
        underlying,
        signalType,
        candleAnalysis: breakoutAnalysis,
        confidence: Math.round(confidence),
      };
      
      const signal = await storage.createTradingSignal(signalData);
      res.json(signal);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze trading signals" });
    }
  });

  // Smart Suggestions Routes
  app.get("/api/smart-suggestions/:underlying/:expiry", async (req, res) => {
    try {
      const { underlying, expiry } = req.params;
      const { strategy } = req.query;
      
      let suggestions = await storage.getSmartSuggestions(underlying, strategy as string);
      
      if (suggestions.length === 0) {
        // Generate new suggestions
        const generatedSuggestions = await ironCondorEngine.generateSmartSuggestions(underlying, expiry);
        
        // Store suggestions in storage
        for (const suggestion of generatedSuggestions) {
          await storage.createSmartSuggestion(suggestion);
        }
        
        suggestions = await storage.getSmartSuggestions(underlying, strategy as string);
      }
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch smart suggestions" });
    }
  });

  // Trailing Stop Loss Route
  app.post("/api/trailing-stop-loss", async (req, res) => {
    try {
      const { currentPL, maxProfit, trailPercent } = req.body;
      
      if (typeof currentPL !== "number" || typeof maxProfit !== "number") {
        return res.status(400).json({ message: "Invalid P&L data" });
      }
      
      const trailingStopLoss = ironCondorEngine.calculateTrailingStopLoss(
        currentPL,
        maxProfit,
        trailPercent || 30
      );
      
      res.json(trailingStopLoss);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate trailing stop loss" });
    }
  });

  // Iron Condor Metrics Route
  app.post("/api/iron-condor/metrics", async (req, res) => {
    try {
      const {
        putBuyStrike,
        putSellStrike,
        callSellStrike,
        callBuyStrike,
        putBuyPrice,
        putSellPrice,
        callSellPrice,
        callBuyPrice,
      } = req.body;
      
      const metrics = ironCondorEngine.calculateIronCondorMetrics(
        putBuyStrike,
        putSellStrike,
        callSellStrike,
        callBuyStrike,
        putBuyPrice,
        putSellPrice,
        callSellPrice,
        callBuyPrice
      );
      
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate iron condor metrics" });
    }
  });

  // User Capital Routes
  app.get("/api/user-capital", async (req, res) => {
    try {
      const capital = await storage.getUserCapital();
      res.json(capital);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user capital" });
    }
  });

  app.post("/api/user-capital", async (req, res) => {
    try {
      const validatedData = insertUserCapitalSchema.parse(req.body);
      const capital = await storage.updateUserCapital(validatedData);
      res.json(capital);
    } catch (error) {
      res.status(400).json({ message: "Invalid capital data" });
    }
  });

  // Update Iron Condor P&L
  app.patch("/api/iron-condor/:id/pl", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { currentPL } = req.body;
      const position = await storage.updateIronCondorPL(id, parseFloat(currentPL));
      if (!position) {
        return res.status(404).json({ message: "Iron condor position not found" });
      }
      res.json(position);
    } catch (error) {
      res.status(500).json({ message: "Failed to update iron condor P&L" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
