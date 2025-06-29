import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { BarChart3, PlayCircle, Database, TrendingUp, Target, DollarSign, Percent, Calendar } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BacktestConfig {
  underlying: string;
  startDate: string;
  endDate: string;
  strategy: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  initialCapital: number;
  riskPerTrade: number;
}

interface BacktestResult {
  id: number;
  strategy: string;
  startDate: string;
  endDate: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPL: string;
  maxDrawdown: string;
  sharpeRatio: string;
  winRate: string;
  avgWin: string;
  avgLoss: string;
  createdAt: string;
}

export function BacktestDashboard() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<BacktestConfig>({
    underlying: "NIFTY",
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    strategy: "MODERATE",
    initialCapital: 500000,
    riskPerTrade: 5,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: backtestResults, isLoading } = useQuery<BacktestResult[]>({
    queryKey: ["/api/backtest/results"],
  });

  const seedDataMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/backtest/seed"),
    onSuccess: () => {
      toast({
        title: "Data Seeded",
        description: "Historical data has been seeded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to seed historical data",
        variant: "destructive",
      });
    },
  });

  const runBacktestMutation = useMutation({
    mutationFn: (data: BacktestConfig) => apiRequest("POST", "/api/backtest/run", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtest/results"] });
      setIsConfigOpen(false);
      toast({
        title: "Backtest Complete",
        description: "Backtest has been completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run backtest",
        variant: "destructive",
      });
    },
  });

  const handleRunBacktest = () => {
    runBacktestMutation.mutate(config);
  };

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

  const getPerformanceColor = (value: number) => {
    if (value > 0) return "text-profit-green";
    if (value < 0) return "text-loss-red";
    return "text-secondary";
  };

  const latestResult = backtestResults?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="trading-card border-trading-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-profit-green" />
              <span className="text-primary">Backtest Dashboard</span>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => seedDataMutation.mutate()}
                disabled={seedDataMutation.isPending}
                variant="outline"
                size="sm"
                className="border-trading-border hover:bg-trading-border"
              >
                <Database className="h-4 w-4 mr-2" />
                {seedDataMutation.isPending ? "Seeding..." : "Seed Data"}
              </Button>
              <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-profit-green hover:bg-profit-green/90 text-trading-bg">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Run Backtest
                  </Button>
                </DialogTrigger>
                <DialogContent className="trading-card border-trading-border">
                  <DialogHeader>
                    <DialogTitle className="text-primary">Configure Backtest</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-secondary">Underlying</Label>
                        <Select value={config.underlying} onValueChange={(value) => setConfig(c => ({ ...c, underlying: value }))}>
                          <SelectTrigger className="bg-trading-bg border-trading-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="trading-card border-trading-border">
                            <SelectItem value="NIFTY">NIFTY</SelectItem>
                            <SelectItem value="BANKNIFTY">BANKNIFTY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-secondary">Strategy</Label>
                        <Select value={config.strategy} onValueChange={(value: any) => setConfig(c => ({ ...c, strategy: value }))}>
                          <SelectTrigger className="bg-trading-bg border-trading-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="trading-card border-trading-border">
                            <SelectItem value="CONSERVATIVE">Conservative</SelectItem>
                            <SelectItem value="MODERATE">Moderate</SelectItem>
                            <SelectItem value="AGGRESSIVE">Aggressive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-secondary">Start Date</Label>
                        <Input
                          type="date"
                          value={config.startDate}
                          onChange={(e) => setConfig(c => ({ ...c, startDate: e.target.value }))}
                          className="bg-trading-bg border-trading-border"
                        />
                      </div>
                      <div>
                        <Label className="text-secondary">End Date</Label>
                        <Input
                          type="date"
                          value={config.endDate}
                          onChange={(e) => setConfig(c => ({ ...c, endDate: e.target.value }))}
                          className="bg-trading-bg border-trading-border"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-secondary">Initial Capital</Label>
                        <Input
                          type="number"
                          value={config.initialCapital}
                          onChange={(e) => setConfig(c => ({ ...c, initialCapital: parseInt(e.target.value) }))}
                          className="bg-trading-bg border-trading-border"
                        />
                      </div>
                      <div>
                        <Label className="text-secondary">Risk Per Trade (%)</Label>
                        <Input
                          type="number"
                          value={config.riskPerTrade}
                          onChange={(e) => setConfig(c => ({ ...c, riskPerTrade: parseFloat(e.target.value) }))}
                          className="bg-trading-bg border-trading-border"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleRunBacktest}
                      disabled={runBacktestMutation.isPending}
                      className="w-full bg-profit-green hover:bg-profit-green/90 text-trading-bg"
                    >
                      {runBacktestMutation.isPending ? "Running Backtest..." : "Start Backtest"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Latest Results Summary */}
      {latestResult && (
        <Card className="trading-card border-trading-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-primary">Latest Backtest Results</span>
              <Badge className={`px-3 py-1 ${getStrategyColor(latestResult.strategy)}`}>
                {latestResult.strategy}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-secondary" />
                <p className="text-xs text-secondary">Total P&L</p>
                <p className={`font-semibold text-lg ${getPerformanceColor(parseFloat(latestResult.totalPL))}`}>
                  {formatCurrency(parseFloat(latestResult.totalPL))}
                </p>
              </div>
              <div className="text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-secondary" />
                <p className="text-xs text-secondary">Win Rate</p>
                <p className="font-semibold text-lg text-primary">
                  {parseFloat(latestResult.winRate).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-secondary" />
                <p className="text-xs text-secondary">Sharpe Ratio</p>
                <p className="font-semibold text-lg text-primary">
                  {parseFloat(latestResult.sharpeRatio).toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <Percent className="h-6 w-6 mx-auto mb-2 text-secondary" />
                <p className="text-xs text-secondary">Max Drawdown</p>
                <p className="font-semibold text-lg text-loss-red">
                  {parseFloat(latestResult.maxDrawdown).toFixed(1)}%
                </p>
              </div>
            </div>
            
            <Separator className="trading-border" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-secondary">Total Trades</p>
                <p className="font-semibold text-primary">{latestResult.totalTrades}</p>
              </div>
              <div>
                <p className="text-xs text-secondary">Winning Trades</p>
                <p className="font-semibold text-profit-green">{latestResult.winningTrades}</p>
              </div>
              <div>
                <p className="text-xs text-secondary">Losing Trades</p>
                <p className="font-semibold text-loss-red">{latestResult.losingTrades}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-secondary">Avg Win</p>
                <p className="font-semibold text-profit-green">
                  {formatCurrency(parseFloat(latestResult.avgWin))}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary">Avg Loss</p>
                <p className="font-semibold text-loss-red">
                  {formatCurrency(parseFloat(latestResult.avgLoss))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Results */}
      <Card className="trading-card border-trading-border">
        <CardHeader>
          <CardTitle className="text-primary">Backtest History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : backtestResults && backtestResults.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b trading-border hover:bg-transparent">
                    <TableHead className="text-secondary">Strategy</TableHead>
                    <TableHead className="text-secondary">Period</TableHead>
                    <TableHead className="text-secondary">Trades</TableHead>
                    <TableHead className="text-secondary">Win Rate</TableHead>
                    <TableHead className="text-secondary">Total P&L</TableHead>
                    <TableHead className="text-secondary">Sharpe</TableHead>
                    <TableHead className="text-secondary">Drawdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backtestResults.map((result) => (
                    <TableRow key={result.id} className="border-b trading-border/30 hover:bg-trading-border/20">
                      <TableCell>
                        <Badge className={`${getStrategyColor(result.strategy)} text-xs`}>
                          {result.strategy}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary">
                        <div className="text-xs">
                          <div>{new Date(result.startDate).toLocaleDateString()}</div>
                          <div className="text-secondary">to {new Date(result.endDate).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-primary">{result.totalTrades}</TableCell>
                      <TableCell className="text-primary">{parseFloat(result.winRate).toFixed(1)}%</TableCell>
                      <TableCell className={`font-semibold ${getPerformanceColor(parseFloat(result.totalPL))}`}>
                        {formatCurrency(parseFloat(result.totalPL))}
                      </TableCell>
                      <TableCell className="text-primary">{parseFloat(result.sharpeRatio).toFixed(2)}</TableCell>
                      <TableCell className="text-loss-red">{parseFloat(result.maxDrawdown).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-secondary mb-4 mx-auto" />
              <p className="text-secondary">No backtest results available</p>
              <p className="text-xs text-secondary mt-2">Run your first backtest to see results here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
