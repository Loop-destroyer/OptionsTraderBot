import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Wallet, Plus, Minus } from "lucide-react";
import type { UserCapital } from "@shared/schema";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CapitalManagement() {
  const [isAddCapitalOpen, setIsAddCapitalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState<"add" | "withdraw">("add");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: capital, isLoading } = useQuery<UserCapital>({
    queryKey: ["/api/user-capital"],
  });

  const updateCapitalMutation = useMutation({
    mutationFn: (data: { totalCapital: string; availableCapital: string; usedCapital: string }) =>
      apiRequest("POST", "/api/user-capital", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-capital"] });
      setIsAddCapitalOpen(false);
      setAmount("");
      toast({
        title: "Capital Updated",
        description: `Successfully ${operation === "add" ? "added" : "withdrew"} ${formatCurrency(parseFloat(amount))}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update capital",
        variant: "destructive",
      });
    },
  });

  const handleCapitalUpdate = () => {
    if (!capital || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const currentTotal = parseFloat(capital.totalCapital);
    const currentAvailable = parseFloat(capital.availableCapital);
    const currentUsed = parseFloat(capital.usedCapital);
    const amountNum = parseFloat(amount);

    let newTotal = currentTotal;
    let newAvailable = currentAvailable;

    if (operation === "add") {
      newTotal = currentTotal + amountNum;
      newAvailable = currentAvailable + amountNum;
    } else {
      // Withdraw
      if (amountNum > currentAvailable) {
        toast({
          title: "Insufficient Funds",
          description: "Cannot withdraw more than available capital",
          variant: "destructive",
        });
        return;
      }
      newTotal = currentTotal - amountNum;
      newAvailable = currentAvailable - amountNum;
    }

    updateCapitalMutation.mutate({
      totalCapital: newTotal.toString(),
      availableCapital: newAvailable.toString(),
      usedCapital: currentUsed.toString(),
    });
  };

  if (isLoading) {
    return (
      <Card className="trading-card border-trading-border">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCapital = capital ? parseFloat(capital.totalCapital) : 0;
  const availableCapital = capital ? parseFloat(capital.availableCapital) : 0;
  const usedCapital = capital ? parseFloat(capital.usedCapital) : 0;
  const usagePercentage = totalCapital > 0 ? (usedCapital / totalCapital) * 100 : 0;

  return (
    <Card className="trading-card border-trading-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-profit-green" />
            <span className="text-primary">Capital Management</span>
          </div>
          <Dialog open={isAddCapitalOpen} onOpenChange={setIsAddCapitalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-profit-green hover:bg-profit-green/90 text-trading-bg">
                <Plus className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </DialogTrigger>
            <DialogContent className="trading-card border-trading-border">
              <DialogHeader>
                <DialogTitle className="text-primary">Manage Capital</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant={operation === "add" ? "default" : "outline"}
                    onClick={() => setOperation("add")}
                    className={operation === "add" ? "bg-profit-green text-trading-bg" : "border-trading-border"}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Capital
                  </Button>
                  <Button
                    variant={operation === "withdraw" ? "default" : "outline"}
                    onClick={() => setOperation("withdraw")}
                    className={operation === "withdraw" ? "bg-loss-red text-trading-bg" : "border-trading-border"}
                  >
                    <Minus className="h-4 w-4 mr-1" />
                    Withdraw
                  </Button>
                </div>
                <div>
                  <Label htmlFor="amount" className="text-secondary">
                    Amount ({operation === "add" ? "Add" : "Withdraw"})
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-trading-bg border-trading-border text-primary"
                  />
                </div>
                <Button
                  onClick={handleCapitalUpdate}
                  disabled={updateCapitalMutation.isPending}
                  className={`w-full ${
                    operation === "add" 
                      ? "bg-profit-green hover:bg-profit-green/90" 
                      : "bg-loss-red hover:bg-loss-red/90"
                  } text-trading-bg`}
                >
                  {updateCapitalMutation.isPending 
                    ? "Processing..." 
                    : `${operation === "add" ? "Add" : "Withdraw"} ${formatCurrency(parseFloat(amount) || 0)}`
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-secondary mb-1">Total Capital</p>
            <p className="font-semibold text-lg text-primary">
              {formatCurrency(totalCapital)}
            </p>
          </div>
          <div>
            <p className="text-xs text-secondary mb-1">Available</p>
            <p className="font-semibold text-lg text-profit-green">
              {formatCurrency(availableCapital)}
            </p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-secondary">Capital Usage</p>
            <p className="text-xs text-secondary">
              {formatPercentage(usagePercentage)} used
            </p>
          </div>
          <Progress 
            value={usagePercentage} 
            className="h-2 bg-trading-border"
          />
          <div className="flex justify-between mt-1 text-xs">
            <span className="text-loss-red">Used: {formatCurrency(usedCapital)}</span>
            <span className="text-profit-green">Free: {formatCurrency(availableCapital)}</span>
          </div>
        </div>

        {capital && (
          <div className="pt-2 border-t trading-border">
            <p className="text-xs text-secondary">Last Updated</p>
            <p className="text-xs text-secondary">
              {new Date(capital.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
