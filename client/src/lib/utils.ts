import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(percent: number): string {
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
}

export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

export function calculateBreakevenPoints(
  putSellStrike: number,
  callSellStrike: number,
  netPremium: number
): { lower: number; upper: number } {
  return {
    lower: putSellStrike - netPremium,
    upper: callSellStrike + netPremium,
  };
}

export function calculateIronCondorPL(
  spotPrice: number,
  putBuyStrike: number,
  putSellStrike: number,
  callSellStrike: number,
  callBuyStrike: number,
  netPremium: number
): number {
  let pl = netPremium; // Start with net premium received

  // PUT spread
  if (spotPrice <= putBuyStrike) {
    pl -= (putSellStrike - putBuyStrike);
  } else if (spotPrice < putSellStrike) {
    pl -= (putSellStrike - spotPrice);
  }

  // CALL spread
  if (spotPrice >= callBuyStrike) {
    pl -= (callBuyStrike - callSellStrike);
  } else if (spotPrice > callSellStrike) {
    pl -= (spotPrice - callSellStrike);
  }

  return pl;
}
