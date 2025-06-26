import { NseIndia } from 'stock-nse-india';

interface NSEOptionsData {
  underlying: string;
  expiry: string;
  strike: number;
  peLtp: number;
  ceLtp: number;
  peVolume: number;
  ceVolume: number;
}

interface NSEMarketData {
  underlying: string;
  spotPrice: number;
  change: number;
  changePercent: number;
  marketStatus: string;
}

interface CandleStickData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

// MStock API Response interfaces
interface MStockOptionData {
  strikePrice: number;
  expiryDate: string;
  callLTP: number;
  putLTP: number;
  callVolume: number;
  putVolume: number;
}

interface MStockMarketData {
  symbol: string;
  ltp: number;
  change: number;
  pChange: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

interface MStockCandleData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const nseIndia = new NseIndia();

export class NSEApiService {
  private baseUrl: string;
  private apiKey: string;
  private mstockBaseUrl: string;

  constructor() {
    this.baseUrl = process.env.NSE_API_URL || "https://api.nse.com";
    this.apiKey = process.env.NSE_API_KEY || process.env.API_KEY || "";
    this.mstockBaseUrl = "https://api.mstock.com/v1";
  }

  async getOptionsChain(underlying: string, expiry: string): Promise<NSEOptionsData[]> {
    // Use stock-nse-india to fetch option chain
    let optionChainData;
    if (underlying === 'NIFTY' || underlying === 'BANKNIFTY') {
      optionChainData = await nseIndia.getIndexOptionChain(underlying);
    } else {
      optionChainData = await nseIndia.getEquityOptionChain(underlying);
    }
    // Find the expiry data
    const expiryData = optionChainData.records.data.filter((item: any) => item.expiryDate === expiry);
    // Map to NSEOptionsData[]
    return expiryData.map((item: any) => ({
      underlying,
      expiry: item.expiryDate,
      strike: item.strikePrice,
      peLtp: item.PE ? item.PE.lastPrice : 0,
      ceLtp: item.CE ? item.CE.lastPrice : 0,
      peVolume: item.PE ? item.PE.totalTradedVolume : 0,
      ceVolume: item.CE ? item.CE.totalTradedVolume : 0,
    }));
  }

  async getMarketData(underlying: string): Promise<NSEMarketData> {
    let spotPrice = 0, change = 0, changePercent = 0;
    if (underlying === 'NIFTY' || underlying === 'BANKNIFTY') {
      const indices = await nseIndia.getEquityStockIndices(underlying);
      const index = indices.data.find((idx: any) => idx.index === underlying);
      if (index) {
        spotPrice = index.lastPrice ?? index.last ?? 0;
        change = index.change ?? 0;
        changePercent = index.pChange ?? 0;
      }
    } else {
      const details = await nseIndia.getEquityDetails(underlying);
      spotPrice = details.priceInfo.lastPrice;
      change = details.priceInfo.change;
      changePercent = details.priceInfo.pChange;
    }
    return {
      underlying,
      spotPrice,
      change,
      changePercent,
      marketStatus: this.getMarketStatus(),
    };
  }

  async getCandleStickData(underlying: string, interval: string = "15m", count: number = 4): Promise<CandleStickData[]> {
    let candles: any[] = [];
    if (underlying === 'NIFTY' || underlying === 'BANKNIFTY') {
      const result = await nseIndia.getIndexIntradayData(underlying);
      candles = result.data;
    } else {
      const result = await nseIndia.getEquityIntradayData(underlying);
      candles = result.data;
    }
    return candles.slice(-count).map((candle: any) => ({
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      timestamp: candle.time,
    }));
  }

  private formatExpiryForMStock(expiry: string): string {
    // Convert from "28 DEC 2023" to MStock format if needed
    // MStock typically uses DD-MMM-YYYY format
    return expiry.replace(/\s+/g, '-');
  }

  private getMarketStatus(): string {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
    const currentTime = hour * 100 + minute;

    // Market hours: 9:15 AM to 3:30 PM IST
    if (currentTime >= 915 && currentTime <= 1530) {
      return "OPEN";
    } else {
      return "CLOSED";
    }
  }
}

export const nseApiService = new NSEApiService();
