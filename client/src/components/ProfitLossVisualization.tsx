import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function ProfitLossVisualization() {
  // Mock breakeven points for demo
  const lowerBreakeven = 21125;
  const upperBreakeven = 21875;

  return (
    <section className="p-4">
      <Card className="trading-card border-trading-border">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-3 text-primary">P&L Visualization</h2>
          
          {/* Chart placeholder with grid */}
          <div className="bg-trading-bg rounded border trading-border p-4 h-48 relative overflow-hidden">
            {/* Placeholder content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-secondary mb-2 mx-auto" />
                <p className="text-secondary">P&L Chart</p>
                <p className="text-xs text-secondary">Interactive profit/loss visualization</p>
              </div>
            </div>
            
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="h-full w-full grid grid-cols-8 grid-rows-6 gap-0">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-r border-b trading-border/30"
                  ></div>
                ))}
              </div>
            </div>

            {/* Profit zone indicator */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="h-2 bg-gradient-to-r from-loss-red/30 via-profit-green/30 to-loss-red/30 rounded"></div>
              <div className="flex justify-between mt-1 text-xs text-secondary">
                <span>Loss</span>
                <span>Profit Zone</span>
                <span>Loss</span>
              </div>
            </div>
          </div>

          {/* Breakeven Points */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-secondary mb-1">Lower Breakeven</p>
              <p className="font-semibold text-warning-amber">{lowerBreakeven.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-secondary mb-1">Upper Breakeven</p>
              <p className="font-semibold text-warning-amber">{upperBreakeven.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-profit-green rounded-full"></div>
                <span className="text-secondary">Profit Zone: {lowerBreakeven} - {upperBreakeven}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
