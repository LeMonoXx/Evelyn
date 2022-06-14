import { MarketEntry } from "src/app/models";

export interface TradeCalculation {
    type_id: number,
    type_name: string,
    quantity: number,
    singleBuyPrice: number;
    buyPriceX: number;
    // the sell price for a single item
    singleSellPrice: number;
    // the sell price for number of x item
    sellPriceX: number, 
    artificialSellPrice: boolean,
    brokerFee: number, 
    saleTax: number, 
    nettoSalePrice: number,
    shippingCost: number,
    profit: number
    usedMarketEntries: MarketEntry[],
    hasEnoughMarketVolumen: boolean
}