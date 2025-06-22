import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, Calculator, TrendingUp } from "lucide-react";
import type { OptionsChainData, UserCapital } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StrategyParams {
  underlying: string;
  expiry: string;
  putBuyStrike: number;
  putSellStrike: number;
  callSellStrike: number;
  callBuyStrike: number;
  quantity: number;
  capital: number;
}

export function CustomStrategyForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [params, setParams] = useState<StrategyParams>({
    underlying: "NIFTY",
    expiry: "28 DEC 2023",
    putBuyStrike: 21000,
    putSellStrike: 21200,
    callSellStrike: 21800,
    callBuyStrike: 22000,
    quantity: 50,
    capital: 100000,
  });
  const [metrics, setMetrics] = useState<any>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: optionsChain } = useQuery<OptionsChainData[]>({
    queryKey: ["/api/options-chain/NIFTY/28 DEC 2023"],
  });

  const { data: userCapital } = useQuery<UserCapital>({
    queryKey: ["/api/user-capital"],
  });

  const calculateMetricsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/iron-condor/metrics", data),
    onSuccess: (data) => {
      setMetrics(data);
    },
  });

  const createPositionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/iron-condor", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/iron-condor/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-capital"] });
      setIsFormOpen(false);
      toast({
        title: "Strategy Created",
        description: "Your custom iron condor strategy has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create strategy",
        variant: "destructive",
      });
    },
  });

  const handleCalculateMetrics = () => {
    if (!optionsChain || optionsChain.length === 0) {
      toast({
        title: "No Options Data",
        description: "Options chain data is not available",
        variant: "destructive",
      });
      return;
    }

    // Find prices for the selected strikes
    const putBuyOption = optionsChain.find(o => o.strike === params.putBuyStrike);
    const putSellOption = optionsChain.find(o => o.strike === params.putSellStrike);
    const callSellOption = optionsChain.find(o => o.strike === params.callSellStrike);
    const callBuyOption = optionsChain.find(o => o.strike === params.callBuyStrike);

    if (!putBuyOption || !putSellOption || !callSellOption || !callBuyOption) {
      toast({
        title: "Invalid Strikes",
        description: "One or more selected strikes are not available in the options chain",
        variant: "destructive",
      });
      return;
    }

    calculateMetricsMutation.mutate({
      putBuyStrike: params.putBuyStrike,
      putSellStrike: params.putSellStrike,
      callSellStrike: params.callSellStrike,
      callBuyStrike: params.callBuyStrike,
      putBuyPrice: parseFloat(putBuyOption.peLtp || "0"),
      putSellPrice: parseFloat(putSellOption.peLtp || "0"),
      callSellPrice: parseFloat(callSellOption.ceLtp || "0"),
      callBuyPrice: parseFloat(callBuyOption.ceLtp || "0"),
    });
  };

  const handleCreateStrategy = () => {
    if (!metrics) {
      toast({
        title: "Calculate Metrics First",
        description: "Please calculate strategy metrics before creating the position",
        variant: "destructive",
      });
      return;
    }

    const availableCapital = userCapital ? parseFloat(userCapital.availableCapital) : 0;
    if (params.capital > availableCapital) {
      toast({
        title: "Insufficient Capital",
        description: "Not enough available capital for this strategy",
        variant: "destructive",
      });
      return;
    }

    // Find prices for the selected strikes
    const putBuyOption = optionsChain?.find(o => o.strike === params.putBuyStrike);
    const putSellOption = optionsChain?.find(o => o.strike === params.putSellStrike);
    const callSellOption = optionsChain?.find(o => o.strike === params.callSellStrike);
    const callBuyOption = optionsChain?.find(o => o.strike === params.callBuyStrike);

    createPositionMutation.mutate({
      underlying: params.underlying,
      expiry: params.expiry,
      putBuyStrike: params.putBuyStrike,
      putSellStrike: params.putSellStrike,
      callSellStrike: params.callSellStrike,
      callBuyStrike: params.callBuyStrike,
      putBuyPrice: putBuyOption?.peLtp || "0",
      putSellPrice: putSellOption?.peLtp || "0",
      callSellPrice: callSellOption?.ceLtp || "0",
      callBuyPrice: callBuyOption?.ceLtp || "0",
      netPremium: metrics.maxProfit.toString(),
      maxProfit: metrics.maxProfit.toString(),
      maxLoss: metrics.maxLoss.toString(),
      capital: params.capital.toString(),
      quantity: params.quantity,
    });
  };

  const strikes = optionsChain?.map(o => o.strike).sort((a, b) => a - b) || [];

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogTrigger asChild>
        <Button className="bg-profit-green hover:bg-profit-green/90 text-trading-bg">
          <Settings className="h-4 w-4 mr-2" />
          Custom Strategy
        </Button>
      </DialogTrigger>
      <DialogContent className="trading-card border-trading-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-profit-green" />
            <span>Create Custom Iron Condor Strategy</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Parameters */}
          <Card className="trading-card border-trading-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-primary">Strategy Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-secondary">Underlying</Label>
                  <Select value={params.underlying} onValueChange={(value) => setParams(p => ({ ...p, underlying: value }))}>
                    <SelectTrigger className="bg-trading-bg border-trading-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="trading-card border-trading-border">
                      <SelectItem value="NIFTY">NIFTY</SelectItem>
                      <SelectItem value="BANKNIFTY">BANKNIFTY</SelectItem>
                      <SelectItem value="FINNIFTY">FINNIFTY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-secondary">Expiry</Label>
                  <Select value={params.expiry} onValueChange={(value) => setParams(p => ({ ...p, expiry: value }))}>
                    <SelectTrigger className="bg-trading-bg border-trading-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="trading-card border-trading-border">
                      <SelectItem value="28 DEC 2023">28 DEC 2023</SelectItem>
                      <SelectItem value="04 JAN 2024">04 JAN 2024</SelectItem>
                      <SelectItem value="11 JAN 2024">11 JAN 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-secondary text-xs">PUT Buy</Label>
                  <Select value={params.putBuyStrike.toString()} onValueChange={(value) => setParams(p => ({ ...p, putBuyStrike: parseInt(value) }))}>
                    <SelectTrigger className="bg-trading-bg border-trading-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="trading-card border-trading-border">
                      {strikes.map(strike => (
                        <SelectItem key={strike} value={strike.toString()}>{strike}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-secondary text-xs">PUT Sell</Label>
                  <Select value={params.putSellStrike.toString()} onValueChange={(value) => setParams(p => ({ ...p, putSellStrike: parseInt(value) }))}>
                    <SelectTrigger className="bg-trading-bg border-trading-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="trading-card border-trading-border">
                      {strikes.map(strike => (
                        <SelectItem key={strike} value={strike.toString()}>{strike}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-secondary text-xs">CALL Sell</Label>
                  <Select value={params.callSellStrike.toString()} onValueChange={(value) => setParams(p => ({ ...p, callSellStrike: parseInt(value) }))}>
                    <SelectTrigger className="bg-trading-bg border-trading-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="trading-card border-trading-border">
                      {strikes.map(strike => (
                        <SelectItem key={strike} value={strike.toString()}>{strike}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-secondary text-xs">CALL Buy</Label>
                  <Select value={params.callBuyStrike.toString()} onValueChange={(value) => setParams(p => ({ ...p, callBuyStrike: parseInt(value) }))}>
                    <SelectTrigger className="bg-trading-bg border-trading-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="trading-card border-trading-border">
                      {strikes.map(strike => (
                        <SelectItem key={strike} value={strike.toString()}>{strike}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-secondary">Quantity (Lots)</Label>
                  <Input
                    type="number"
                    value={params.quantity}
                    onChange={(e) => setParams(p => ({ ...p, quantity: parseInt(e.target.value) }))}
                    className="bg-trading-bg border-trading-border"
                  />
                </div>
                <div>
                  <Label className="text-secondary">Capital Required</Label>
                  <Input
                    type="number"
                    value={params.capital}
                    onChange={(e) => setParams(p => ({ ...p, capital: parseFloat(e.target.value) }))}
                    className="bg-trading-bg border-trading-border"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculateMetrics}
            disabled={calculateMetricsMutation.isPending}
            className="w-full bg-warning-amber hover:bg-warning-amber/90 text-trading-bg"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {calculateMetricsMutation.isPending ? "Calculating..." : "Calculate Strategy Metrics"}
          </Button>

          {/* Metrics Display */}
          {metrics && (
            <Card className="trading-card border-profit-green/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-profit-green">Strategy Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-secondary">Max Profit</p>
                    <p className="font-semibold text-profit-green">
                      {formatCurrency(metrics.maxProfit * params.quantity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Max Loss</p>
                    <p className="font-semibold text-loss-red">
                      {formatCurrency(metrics.maxLoss * params.quantity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Risk-Reward</p>
                    <Badge className="bg-warning-amber text-trading-bg">
                      1:{metrics.riskReward.toFixed(2)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Success Probability</p>
                    <Badge className="bg-profit-green text-trading-bg">
                      {metrics.probability}%
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-secondary">Lower Breakeven</p>
                    <p className="font-semibold text-warning-amber">
                      {metrics.lowerBreakeven.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-secondary">Upper Breakeven</p>
                    <p className="font-semibold text-warning-amber">
                      {metrics.upperBreakeven.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Strategy Button */}
          <Button
            onClick={handleCreateStrategy}
            disabled={createPositionMutation.isPending || !metrics}
            className="w-full bg-profit-green hover:bg-profit-green/90 text-trading-bg"
          >
            {createPositionMutation.isPending ? "Creating Strategy..." : "Create Iron Condor Strategy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}