import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { TradingSignal, TrailingStopLoss } from "@shared/schema";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export function SignalAnalysis() {
  const queryClient = useQueryClient();
  
  const { data: signal, isLoading } = useQuery<TradingSignal>({
    queryKey: ["/api/trading-signals/NIFTY"],
  });

  const analyzeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/trading-signals/analyze/NIFTY"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trading-signals/NIFTY"] });
    },
  });

  // Mock trailing stop loss data for demo
  const trailingStopLoss: TrailingStopLoss = {
    currentPL: 2150,
    currentPLPercent: 51,
    trailLevel: 1800,
    trailLevelPercent: 42,
    status: "MONITORING",
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case "BULLISH":
        return "text-profit-green";
      case "BEARISH":
        return "text-loss-red";
      default:
        return "text-warning-amber";
    }
  };

  const getTrailStatusColor = (status: string) => {
    switch (status) {
      case "TRAILING_ACTIVE":
        return "bg-profit-green text-trading-bg";
      case "EXIT_SIGNAL":
        return "bg-loss-red text-trading-bg";
      default:
        return "bg-warning-amber text-trading-bg";
    }
  };

  if (isLoading) {
    return (
      <section className="p-4">
        <Card className="trading-card border-trading-border">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="p-4">
      <Card className="trading-card border-trading-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-primary">Signal Analysis</h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-secondary">
                {signal ? "Updated 2 min ago" : "No data"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="border-trading-border hover:bg-trading-border"
              >
                <RefreshCw className={`h-4 w-4 ${analyzeMutation.isPending ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          
          {/* 15-minute Analysis */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-primary">15-Min Breakout Analysis</p>
              {signal && (
                <Badge className={`${getSignalColor(signal.signalType)} bg-transparent border px-2 py-1 text-xs font-medium`}>
                  {signal.signalType} ({signal.confidence}%)
                </Badge>
              )}
            </div>
            
            {signal?.candleAnalysis && (
              <>
                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                  <div className={`p-2 rounded ${
                    (signal.candleAnalysis as any).candle1 > 0 ? "bg-profit-green/20" : "bg-loss-red/20"
                  }`}>
                    <p className="text-secondary">Candle 1</p>
                    <p className="font-semibold text-primary">
                      {formatPercentage((signal.candleAnalysis as any).candle1)}
                    </p>
                  </div>
                  <div className={`p-2 rounded ${
                    (signal.candleAnalysis as any).candle2 > 0 ? "bg-profit-green/30" : "bg-loss-red/30"
                  }`}>
                    <p className="text-secondary">Candle 2</p>
                    <p className="font-semibold text-primary">
                      {formatPercentage((signal.candleAnalysis as any).candle2)}
                    </p>
                  </div>
                  <div className={`p-3 rounded border-2 ${
                    (signal.candleAnalysis as any).candle3 > 0 ? "bg-profit-green/40 border-profit-green/60" : "bg-loss-red/40 border-loss-red/60"
                  }`}>
                    <p className="text-secondary font-semibold">Candle 3 (Limits)</p>
                    <p className="font-semibold text-primary">
                      {formatPercentage((signal.candleAnalysis as any).candle3)}
                    </p>
                  </div>
                  <div className={`p-2 rounded ${
                    (signal.candleAnalysis as any).candle4 > 0 ? "bg-profit-green/50" : "bg-loss-red/50"
                  }`}>
                    <p className="text-secondary">Candle 4 (Current)</p>
                    <p className="font-semibold text-primary">
                      {formatPercentage((signal.candleAnalysis as any).candle4)}
                    </p>
                  </div>
                </div>
                
                {/* Breakout Analysis Details */}
                {(signal.candleAnalysis as any).upperLimit && (
                  <div className="bg-trading-border/20 rounded p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-secondary">Upper Limit (High Wick)</p>
                        <p className="font-semibold text-warning-amber">
                          {(signal.candleAnalysis as any).upperLimit?.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-secondary">Lower Limit (Low Wick)</p>
                        <p className="font-semibold text-warning-amber">
                          {(signal.candleAnalysis as any).lowerLimit?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {(signal.candleAnalysis as any).entrySignal && (
                      <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t trading-border">
                        <div>
                          <p className="text-secondary">Entry Point</p>
                          <p className="font-semibold text-profit-green">
                            {(signal.candleAnalysis as any).entryPoint?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-secondary">Stop Loss</p>
                          <p className="font-semibold text-loss-red">
                            {(signal.candleAnalysis as any).stopLoss?.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center pt-2">
                      <p className="text-xs text-secondary">
                        Current Price: <span className="text-primary font-semibold">
                          {(signal.candleAnalysis as any).currentPrice?.toFixed(2)}
                        </span>
                      </p>
                      {(signal.candleAnalysis as any).entrySignal ? (
                        <p className="text-xs text-profit-green font-semibold mt-1">
                          ✓ BREAKOUT DETECTED - Entry Signal Active
                        </p>
                      ) : (
                        <p className="text-xs text-secondary mt-1">
                          Waiting for breakout beyond wick limits
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {!signal && (
              <div className="text-center py-4">
                <p className="text-secondary text-sm">Click refresh to analyze current signals</p>
              </div>
            )}
          </div>

          {/* Trailing Stop Loss */}
          <div className="border-t trading-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-primary">Trailing Stop Loss</p>
              <Badge className={`${getTrailStatusColor(trailingStopLoss.status)} px-2 py-1 text-xs font-medium`}>
                {trailingStopLoss.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary mb-1">Current P&L</p>
                <p className="font-semibold text-profit-green">
                  +{formatCurrency(trailingStopLoss.currentPL)} ({trailingStopLoss.currentPLPercent}%)
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary mb-1">Trail Level</p>
                <p className="font-semibold text-warning-amber">
                  {formatCurrency(trailingStopLoss.trailLevel)} ({trailingStopLoss.trailLevelPercent}%)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
