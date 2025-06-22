import { useState } from "react";
import { Home, TrendingUp, Briefcase, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BottomNavigation() {
  const [activeTab, setActiveTab] = useState("home");

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "strategies", label: "Strategies", icon: TrendingUp },
    { id: "portfolio", label: "Portfolio", icon: Briefcase },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    // TODO: Implement navigation logic
    console.log(`Navigate to ${tabId}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 trading-card border-t trading-border z-40">
      <div className="flex justify-around py-3">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto ${
                isActive 
                  ? "text-profit-green" 
                  : "text-secondary hover:text-primary hover:bg-trading-border"
              }`}
              onClick={() => handleTabClick(tab.id)}
            >
              <IconComponent className="h-5 w-5" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
