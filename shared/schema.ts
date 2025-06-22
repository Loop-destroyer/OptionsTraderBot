import { pgTable, text, serial, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ironCondorPositions = pgTable("iron_condor_positions", {
  id: serial("id").primaryKey(),
  underlying: text("underlying").notNull(),
  expiry: text("expiry").notNull(),
  putBuyStrike: integer("put_buy_strike").notNull(),
  putSellStrike: integer("put_sell_strike").notNull(),
  callSellStrike: integer("call_sell_strike").notNull(),
  callBuyStrike: integer("call_buy_strike").notNull(),
  putBuyPrice: decimal("put_buy_price", { precision: 10, scale: 2 }).notNull(),
  putSellPrice: decimal("put_sell_price", { precision: 10, scale: 2 }).notNull(),
  callSellPrice: decimal("call_sell_price", { precision: 10, scale: 2 }).notNull(),
  callBuyPrice: decimal("call_buy_price", { precision: 10, scale: 2 }).notNull(),
  netPremium: decimal("net_premium", { precision: 10, scale: 2 }).notNull(),
  maxProfit: decimal("max_profit", { precision: 10, scale: 2 }).notNull(),
  maxLoss: decimal("max_loss", { precision: 10, scale: 2 }).notNull(),
  capital: decimal("capital", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  currentPL: decimal("current_pl", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userCapital = pgTable("user_capital", {
  id: serial("id").primaryKey(),
  totalCapital: decimal("total_capital", { precision: 12, scale: 2 }).notNull(),
  availableCapital: decimal("available_capital", { precision: 12, scale: 2 }).notNull(),
  usedCapital: decimal("used_capital", { precision: 12, scale: 2 }).notNull().default("0.00"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const optionsChain = pgTable("options_chain", {
  id: serial("id").primaryKey(),
  underlying: text("underlying").notNull(),
  expiry: text("expiry").notNull(),
  strike: integer("strike").notNull(),
  peLtp: decimal("pe_ltp", { precision: 10, scale: 2 }),
  ceLtp: decimal("ce_ltp", { precision: 10, scale: 2 }),
  peVolume: integer("pe_volume"),
  ceVolume: integer("ce_volume"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const tradingSignals = pgTable("trading_signals", {
  id: serial("id").primaryKey(),
  underlying: text("underlying").notNull(),
  signalType: text("signal_type").notNull(), // BULLISH, BEARISH, NEUTRAL
  candleAnalysis: jsonb("candle_analysis").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const smartSuggestions = pgTable("smart_suggestions", {
  id: serial("id").primaryKey(),
  underlying: text("underlying").notNull(),
  expiry: text("expiry").notNull(),
  putBuyStrike: integer("put_buy_strike").notNull(),
  putSellStrike: integer("put_sell_strike").notNull(),
  callSellStrike: integer("call_sell_strike").notNull(),
  callBuyStrike: integer("call_buy_strike").notNull(),
  riskReward: decimal("risk_reward", { precision: 5, scale: 2 }).notNull(),
  successProbability: integer("success_probability").notNull(),
  maxProfit: decimal("max_profit", { precision: 10, scale: 2 }).notNull(),
  maxLoss: decimal("max_loss", { precision: 10, scale: 2 }).notNull(),
  strategy: text("strategy").notNull(), // CONSERVATIVE, MODERATE, AGGRESSIVE
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  underlying: text("underlying").notNull(),
  spotPrice: decimal("spot_price", { precision: 10, scale: 2 }).notNull(),
  change: decimal("change", { precision: 10, scale: 2 }).notNull(),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }).notNull(),
  marketStatus: text("market_status").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertIronCondorSchema = createInsertSchema(ironCondorPositions).omit({
  id: true,
  createdAt: true,
  currentPL: true,
});

export const insertOptionsChainSchema = createInsertSchema(optionsChain).omit({
  id: true,
  lastUpdated: true,
});

export const insertTradingSignalSchema = createInsertSchema(tradingSignals).omit({
  id: true,
  timestamp: true,
});

export const insertSmartSuggestionSchema = createInsertSchema(smartSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  lastUpdated: true,
});

export const insertUserCapitalSchema = createInsertSchema(userCapital).omit({
  id: true,
  lastUpdated: true,
});

export type IronCondorPosition = typeof ironCondorPositions.$inferSelect;
export type InsertIronCondorPosition = z.infer<typeof insertIronCondorSchema>;

export type OptionsChainData = typeof optionsChain.$inferSelect;
export type InsertOptionsChainData = z.infer<typeof insertOptionsChainSchema>;

export type TradingSignal = typeof tradingSignals.$inferSelect;
export type InsertTradingSignal = z.infer<typeof insertTradingSignalSchema>;

export type SmartSuggestion = typeof smartSuggestions.$inferSelect;
export type InsertSmartSuggestion = z.infer<typeof insertSmartSuggestionSchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;

export type UserCapital = typeof userCapital.$inferSelect;
export type InsertUserCapital = z.infer<typeof insertUserCapitalSchema>;

// Additional types for frontend
export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface BreakoutAnalysis {
  candle1: number;
  candle2: number;
  candle3: number;
  candle4: number;
  trend: string;
  strength: number;
  upperLimit?: number;
  lowerLimit?: number;
  entryPoint?: number;
  stopLoss?: number;
  entrySignal?: boolean;
  currentPrice?: number;
}

export interface TrailingStopLoss {
  currentPL: number;
  currentPLPercent: number;
  trailLevel: number;
  trailLevelPercent: number;
  status: string;
}

// Backtesting schemas
export const backtestResults = pgTable("backtest_results", {
  id: serial("id").primaryKey(),
  strategy: text("strategy").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  totalPL: decimal("total_pl", { precision: 12, scale: 2 }).notNull(),
  maxDrawdown: decimal("max_drawdown", { precision: 10, scale: 2 }).notNull(),
  sharpeRatio: decimal("sharpe_ratio", { precision: 5, scale: 2 }),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).notNull(),
  avgWin: decimal("avg_win", { precision: 10, scale: 2 }).notNull(),
  avgLoss: decimal("avg_loss", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const historicalData = pgTable("historical_data", {
  id: serial("id").primaryKey(),
  underlying: text("underlying").notNull(),
  date: timestamp("date").notNull(),
  open: decimal("open", { precision: 10, scale: 2 }).notNull(),
  high: decimal("high", { precision: 10, scale: 2 }).notNull(),
  low: decimal("low", { precision: 10, scale: 2 }).notNull(),
  close: decimal("close", { precision: 10, scale: 2 }).notNull(),
  volume: integer("volume").notNull(),
});

export const insertBacktestResultsSchema = createInsertSchema(backtestResults).omit({
  id: true,
  createdAt: true,
});

export const insertHistoricalDataSchema = createInsertSchema(historicalData).omit({
  id: true,
});

export type BacktestResults = typeof backtestResults.$inferSelect;
export type InsertBacktestResults = z.infer<typeof insertBacktestResultsSchema>;

export type HistoricalData = typeof historicalData.$inferSelect;
export type InsertHistoricalData = z.infer<typeof insertHistoricalDataSchema>;
