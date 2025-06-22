import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SmartSuggestion } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export function SmartSuggestions() {
  const [selectedStrategy, setSelectedStrategy] = useState<string>("CONSERVATIVE");
  
  const { data: suggestions, isLoading } = useQuery<SmartSuggestion[]>({
    queryKey: ["/api/smart-suggestions/NIFTY/28 DEC 2023", selectedStrategy],
  });

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case "CONSERVATIVE":
        return "bg-profit-green/20 text-profit-green border-profit-green/30";
      case "MODERATE":
        return "bg-warning-amber/20 text-warning-amber border-warning-amber/30";
      case "AGGRESSIVE":
        return "bg-loss-red/20 text-loss-red border-loss-red/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  const getSuccessColor = (probability: number) => {
    if (probability >= 85) return "bg-profit-green text-trading-bg";
    if (probability >= 70) return "bg-warning-amber text-trading-bg";
    return "bg-loss-red text-trading-bg";
  };

  const handleApplySetup = (suggestion: SmartSuggestion) => {
    // TODO: Implement apply setup functionality
    console.log("Applying setup:", suggestion);
  };

  if (isLoading) {
    return (
      <section className="p-4">
        <Card className="trading-card border-trading-border">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
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
            <h2 className="text-lg font-semibold text-primary">Smart Suggestions</h2>
            <div className="flex space-x-1">
              {["CONSERVATIVE", "MODERATE", "AGGRESSIVE"].map((strategy) => (
                <Button
                  key={strategy}
                  size="sm"
                  variant="outline"
                  className={`px-2 py-1 text-xs ${
                    selectedStrategy === strategy 
                      ? getStrategyColor(strategy)
                      : "bg-transparent border-trading-border text-secondary hover:bg-trading-border"
                  }`}
                  onClick={() => setSelectedStrategy(strategy)}
                >
                  {strategy.charAt(0) + strategy.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          {suggestions && suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id || index}
                  className={`border rounded-lg p-3 ${getStrategyColor(suggestion.strategy)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-sm text-primary">
                        {suggestion.strategy === "CONSERVATIVE" && "High Probability Setup"}
                        {suggestion.strategy === "MODERATE" && "Balanced Setup"}
                        {suggestion.strategy === "AGGRESSIVE" && "High Risk-Reward Setup"}
                      </p>
                      <p className="text-xs text-secondary">
                        Risk-Reward: 1:{parseFloat(suggestion.riskReward).toFixed(1)}
                      </p>
                    </div>
                    <Badge className={`${getSuccessColor(suggestion.successProbability)} px-2 py-1 text-xs font-medium`}>
                      {suggestion.successProbability}% Success
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1 text-xs mb-2">
                    <div className="text-center">
                      <p className="text-secondary">PE Buy</p>
                      <p className="font-semibold text-primary">{suggestion.putBuyStrike}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">PE Sell</p>
                      <p className="font-semibold text-primary">{suggestion.putSellStrike}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">CE Sell</p>
                      <p className="font-semibold text-primary">{suggestion.callSellStrike}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">CE Buy</p>
                      <p className="font-semibold text-primary">{suggestion.callBuyStrike}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-secondary">
                      Max Profit: <span className="text-profit-green font-semibold">
                        {formatCurrency(parseFloat(suggestion.maxProfit))}
                      </span>
                    </span>
                    <span className="text-secondary">
                      Max Loss: <span className="text-loss-red font-semibold">
                        {formatCurrency(parseFloat(suggestion.maxLoss))}
                      </span>
                    </span>
                  </div>
                  
                  <Button
                    className={`w-full mt-2 py-2 font-medium text-sm ${
                      suggestion.strategy === "CONSERVATIVE" 
                        ? "bg-profit-green hover:bg-profit-green/90 text-trading-bg"
                        : suggestion.strategy === "MODERATE"
                        ? "bg-warning-amber hover:bg-warning-amber/90 text-trading-bg"
                        : "bg-loss-red hover:bg-loss-red/90 text-trading-bg"
                    }`}
                    onClick={() => handleApplySetup(suggestion)}
                  >
                    Apply This Setup
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary text-sm">No suggestions available for {selectedStrategy.toLowerCase()} strategy</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
