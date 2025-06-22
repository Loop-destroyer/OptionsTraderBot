import { TrendingUp, Bell, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { MarketData } from "@shared/schema";
import { formatCurrency, formatPercentage } from "@/lib/utils";

export function AppHeader() {
  const { data: marketData } = useQuery<MarketData>({
    queryKey: ["/api/market-data/NIFTY"],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const isMarketOpen = marketData?.marketStatus === "OPEN";

  return (
    <header className="trading-card border-b trading-border p-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="text-profit-green text-xl h-6 w-6" />
          <div>
            <h1 className="text-lg font-semibold text-primary">Iron Condor Signals</h1>
            <p className="text-xs text-secondary">NSE Options Trading</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs text-secondary">Market Status</p>
            <div className="flex items-center space-x-1">
              <Circle 
                className={`h-2 w-2 fill-current ${
                  isMarketOpen ? "text-profit-green" : "text-loss-red"
                }`} 
              />
              <p className={`text-sm font-medium ${
                isMarketOpen ? "text-profit-green" : "text-loss-red"
              }`}>
                {marketData?.marketStatus || "LOADING"}
              </p>
            </div>
            {marketData && (
              <div className="text-xs text-secondary mt-1">
                NIFTY: {formatCurrency(parseFloat(marketData.spotPrice))} 
                <span className={`ml-1 ${
                  parseFloat(marketData.changePercent) >= 0 ? "text-profit-green" : "text-loss-red"
                }`}>
                  ({formatPercentage(parseFloat(marketData.changePercent))})
                </span>
              </div>
            )}
          </div>
          <Bell className="text-secondary text-lg h-5 w-5 cursor-pointer hover:text-primary" />
        </div>
      </div>
    </header>
  );
}
