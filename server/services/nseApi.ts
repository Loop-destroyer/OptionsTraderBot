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

export class NSEApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NSE_API_URL || "https://api.nse.com";
    this.apiKey = process.env.NSE_API_KEY || process.env.API_KEY || "";
  }

  async getOptionsChain(underlying: string, expiry: string): Promise<NSEOptionsData[]> {
    try {
      // In a real implementation, this would make actual API calls to NSE
      // For now, return mock data structure that matches NSE format
      const mockData: NSEOptionsData[] = [
        { underlying, expiry, strike: 21000, peLtp: 45.50, ceLtp: 580.25, peVolume: 120000, ceVolume: 85000 },
        { underlying, expiry, strike: 21200, peLtp: 125.75, ceLtp: 425.80, peVolume: 250000, ceVolume: 180000 },
        { underlying, expiry, strike: 21500, peLtp: 285.50, ceLtp: 220.25, peVolume: 380000, ceVolume: 320000 },
        { underlying, expiry, strike: 21800, peLtp: 485.75, ceLtp: 85.60, peVolume: 190000, ceVolume: 150000 },
        { underlying, expiry, strike: 22000, peLtp: 625.25, ceLtp: 35.75, peVolume: 80000, ceVolume: 65000 },
      ];

      // Add some realistic price variations
      return mockData.map(item => ({
        ...item,
        peLtp: item.peLtp + (Math.random() - 0.5) * 20,
        ceLtp: item.ceLtp + (Math.random() - 0.5) * 20,
        peVolume: Math.floor(item.peVolume * (0.8 + Math.random() * 0.4)),
        ceVolume: Math.floor(item.ceVolume * (0.8 + Math.random() * 0.4)),
      }));
    } catch (error) {
      console.error("Error fetching options chain:", error);
      throw new Error("Failed to fetch options chain data");
    }
  }

  async getMarketData(underlying: string): Promise<NSEMarketData> {
    try {
      // Mock current market data with realistic variations
      const basePrice = 21542.35;
      const priceVariation = (Math.random() - 0.5) * 100;
      const currentPrice = basePrice + priceVariation;
      const change = priceVariation;
      const changePercent = (change / basePrice) * 100;

      return {
        underlying,
        spotPrice: currentPrice,
        change,
        changePercent,
        marketStatus: this.getMarketStatus(),
      };
    } catch (error) {
      console.error("Error fetching market data:", error);
      throw new Error("Failed to fetch market data");
    }
  }

  async getCandleStickData(underlying: string, interval: string = "15m", count: number = 4): Promise<CandleStickData[]> {
    try {
      // Generate mock candlestick data for the last 4 candles in 15-minute intervals
      const candles: CandleStickData[] = [];
      const basePrice = 21542.35;
      let currentPrice = basePrice;

      for (let i = count - 1; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * 15 * 60 * 1000).toISOString();
        const open = currentPrice;
        const variation = (Math.random() - 0.5) * 50;
        const close = open + variation;
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;
        const volume = Math.floor(Math.random() * 100000) + 50000;

        candles.push({
          open,
          high,
          low,
          close,
          volume,
          timestamp,
        });

        currentPrice = close;
      }

      return candles;
    } catch (error) {
      console.error("Error fetching candlestick data:", error);
      throw new Error("Failed to fetch candlestick data");
    }
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
