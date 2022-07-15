export interface BuyMode {
  id: number;
  name: string;
  description: string;
}

export function getAllowedBuyModes() : BuyMode[] {
    const startStation = ({ id: 0, name: "Buy station only", description: "Items are only bought at the selected buy station." });
    const sellStation = ({ id: 1, name: "Sell structure only", description: "Items are only bought at the selected sell structure." });
    const smart = ({ id: 2, name: "Smart decision", description: "Buy location is decided based on the price (buy price + shipping). WARNING! This requires full market scan -> really decreases performance." });

    return [startStation, sellStation, smart]
}