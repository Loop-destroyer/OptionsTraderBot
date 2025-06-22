import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OptionsChainData, MarketData } from "@shared/schema";
import { formatCurrency, formatVolume } from "@/lib/utils";

export function OptionsChain() {
  const { data: optionsChain, isLoading } = useQuery<OptionsChainData[]>({
    queryKey: ["/api/options-chain/NIFTY/28 DEC 2023"],
    refetchInterval: 30000, // Update every 30 seconds
  });

  const { data: marketData } = useQuery<MarketData>({
    queryKey: ["/api/market-data/NIFTY"],
  });

  if (isLoading) {
    return (
      <section className="p-4">
        <Card className="trading-card border-trading-border">
          <CardContent className="p-4">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const spotPrice = marketData ? parseFloat(marketData.spotPrice) : 21542.35;
  const change = marketData ? parseFloat(marketData.change) : 171.85;
  const changePercent = marketData ? parseFloat(marketData.changePercent) : 0.8;

  return (
    <section className="p-4">
      <Card className="trading-card border-trading-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-primary">Options Chain</h2>
            <div className="text-right">
              <p className="text-xs text-secondary">NIFTY Spot</p>
              <p className={`font-semibold ${changePercent >= 0 ? "text-profit-green" : "text-loss-red"}`}>
                {formatCurrency(spotPrice)} ({changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b trading-border hover:bg-transparent">
                  <TableHead className="text-left text-secondary">Strike</TableHead>
                  <TableHead className="text-right text-secondary">PE LTP</TableHead>
                  <TableHead className="text-right text-secondary">CE LTP</TableHead>
                  <TableHead className="text-right text-secondary">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optionsChain?.map((option, index) => {
                  const isAtm = Math.abs(option.strike - spotPrice) < 100;
                  return (
                    <TableRow
                      key={option.id}
                      className={`border-b trading-border/30 hover:bg-trading-border/20 ${
                        isAtm ? "bg-warning-amber/10" : ""
                      }`}
                    >
                      <TableCell className="font-semibold text-primary">
                        {option.strike}
                      </TableCell>
                      <TableCell className="text-right text-loss-red font-medium">
                        {option.peLtp ? formatCurrency(parseFloat(option.peLtp)) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-profit-green font-medium">
                        {option.ceLtp ? formatCurrency(parseFloat(option.ceLtp)) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-secondary">
                        {option.peVolume && option.ceVolume 
                          ? formatVolume(Math.max(option.peVolume, option.ceVolume))
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {(!optionsChain || optionsChain.length === 0) && (
            <div className="text-center py-8">
              <p className="text-secondary text-sm">No options chain data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
