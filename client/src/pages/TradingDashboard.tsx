import { AppHeader } from "@/components/AppHeader";
import { CurrentPosition } from "@/components/CurrentPosition";
import { SignalAnalysis } from "@/components/SignalAnalysis";
import { SmartSuggestions } from "@/components/SmartSuggestions";
import { OptionsChain } from "@/components/OptionsChain";
import { ProfitLossVisualization } from "@/components/ProfitLossVisualization";
import { CapitalManagement } from "@/components/CapitalManagement";
import { CustomStrategyForm } from "@/components/CustomStrategyForm";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TradingDashboard() {
  const handleCreateNewStrategy = () => {
    // TODO: Implement new strategy creation modal
    console.log("Create new strategy");
  };

  return (
    <div className="min-h-screen trading-bg text-primary pb-20">
      <AppHeader />
      
      <main className="pb-20">
        <CurrentPosition />
        
        {/* Capital Management Section */}
        <section className="p-4">
          <CapitalManagement />
        </section>
        
        <SignalAnalysis />
        <SmartSuggestions />
        
        {/* Custom Strategy Section */}
        <section className="p-4">
          <CustomStrategyForm />
        </section>
        
        <OptionsChain />
        <ProfitLossVisualization />
      </main>

      <BottomNavigation />

      {/* Floating Action Button */}
      <Button
        onClick={handleCreateNewStrategy}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg bg-profit-green hover:bg-profit-green/90 text-trading-bg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
