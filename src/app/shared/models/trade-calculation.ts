import { MarketEntry, } from "src/app/models";
import { GeneralStation } from "..";

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
    netMargin: number,
    usedMarketEntries: MarketEntry[],
    hasEnoughMarketVolumen: boolean,
    requiresShipping: boolean,
    startStation: GeneralStation,
    endStation: GeneralStation
}