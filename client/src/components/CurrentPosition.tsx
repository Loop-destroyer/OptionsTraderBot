import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IronCondorPosition } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export function CurrentPosition() {
  const { data: position, isLoading } = useQuery<IronCondorPosition>({
    queryKey: ["/api/iron-condor/active"],
  });

  if (isLoading) {
    return (
      <section className="p-4">
        <Card className="trading-card border-trading-border">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!position) {
    return (
      <section className="p-4">
        <Card className="trading-card border-trading-border">
          <CardContent className="p-4">
            <div className="text-center py-8">
              <h2 className="text-lg font-semibold mb-2">No Active Iron Condor</h2>
              <p className="text-secondary text-sm">Create a new iron condor position to get started</p>
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
            <h2 className="text-lg font-semibold text-primary">Current Iron Condor</h2>
            <Badge className="bg-profit-green text-trading-bg px-2 py-1 text-xs font-medium">
              {position.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-secondary mb-1">Underlying</p>
              <p className="font-semibold text-primary">{position.underlying}</p>
            </div>
            <div>
              <p className="text-xs text-secondary mb-1">Expiry</p>
              <p className="font-semibold text-primary">{position.expiry}</p>
            </div>
            <div>
              <p className="text-xs text-secondary mb-1">Net Premium</p>
              <p className="font-semibold text-profit-green">
                {formatCurrency(parseFloat(position.netPremium))}
              </p>
            </div>
            <div>
              <p className="text-xs text-secondary mb-1">Max Profit</p>
              <p className="font-semibold text-profit-green">
                {formatCurrency(parseFloat(position.maxProfit))}
              </p>
            </div>
          </div>
          
          {/* Strike Price Display */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-loss-red/20 p-2 rounded">
              <p className="text-xs text-secondary">PUT Buy</p>
              <p className="font-semibold text-sm text-primary">{position.putBuyStrike}</p>
            </div>
            <div className="bg-loss-red/40 p-2 rounded">
              <p className="text-xs text-secondary">PUT Sell</p>
              <p className="font-semibold text-sm text-primary">{position.putSellStrike}</p>
            </div>
            <div className="bg-profit-green/40 p-2 rounded">
              <p className="text-xs text-secondary">CALL Sell</p>
              <p className="font-semibold text-sm text-primary">{position.callSellStrike}</p>
            </div>
            <div className="bg-profit-green/20 p-2 rounded">
              <p className="text-xs text-secondary">CALL Buy</p>
              <p className="font-semibold text-sm text-primary">{position.callBuyStrike}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
