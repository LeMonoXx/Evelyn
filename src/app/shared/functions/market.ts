import { ItemDetails, MarketEntry } from "src/app/models";
import { GeneralStation, ShippingRoute } from "..";
import { TradeCalculation } from "../models/trade-calculation";
import { CalculateShippingCost } from "./shipping-costs";

export function getPriceForN(marketEntries: MarketEntry[], amount: number) : PriceForN {
    let totalPrice = 0;
    let amountLeft = amount;
    const result: PriceForN = { totalPrice: 0, averagePrice: 0, enough: false, usedMarketEntries: [] };

  if(marketEntries && marketEntries.length > 0) {
    // we check our buy-amount against the sell-orders volume_remain and the assigned price.
    for(let i = 0; i <= marketEntries.length - 1; i++) {
      const entry = marketEntries[i];

      // check if our required amount is more than the current market-entry volumen.
      // if so, we gonna use the complete market order.
      const useCompleteOrder = (entry.volume_remain - amountLeft) <= 0;

      if(useCompleteOrder) {
        const costToAdd = (entry.price * entry.volume_remain);
        
        totalPrice += costToAdd; 
        amountLeft -= entry.volume_remain;

        result.usedMarketEntries.push(entry);
      } else {
        const costToAdd = (entry.price * amountLeft);
        totalPrice += costToAdd;
        // we used only a portion of this market entry.
        // so we change the volume_remain with the amount we need to use.
        // entry.volume_remain -= amountLeft;
        result.usedMarketEntries.push(entry);
        amountLeft = 0;
      }

      if(amountLeft <= 0) {
          result.enough = true;
          break;
      }
    }

    // if there are not enough market entries for our required amount
    // we just use the price of the latest to estimate the total costs.
    if(!result.enough) {
      const entry = marketEntries[marketEntries.length -1];
      const costToAdd = (entry.price * amountLeft);
      totalPrice += costToAdd;
      result.usedMarketEntries.push(entry);
      amountLeft = 0;
    }

    result.totalPrice = totalPrice;
    result.averagePrice = (totalPrice / amount);
  }

  return result;
}

export interface PriceForN {
    totalPrice: number;
    averagePrice: number;
    enough: boolean;
    usedMarketEntries: MarketEntry[];
}

export function getTradeCalculation(                
  buyStation: GeneralStation,
  sellStructure: GeneralStation,
  count: number,
  buyEntries: MarketEntry[],
  itemDetails: ItemDetails,
  sellEntries: MarketEntry[],
  saleTaxPercent: number,
  shippingRoute: ShippingRoute
  ): TradeCalculation {
    const prices: TradeCalculation = {
      quantity: count,
      type_id: itemDetails.type_id,
      type_name: itemDetails.name,
      singleBuyPrice: 0,
      buyPriceX: 0,
      singleSellPrice: 0,
      sellPriceX: 0,
      artificialSellPrice: false,
      brokerFee: 0,
      saleTax: 0,
      nettoSalePrice: 0,
      profit: 0,
      shippingCost: 0,
      usedMarketEntries: [],
      hasEnoughMarketVolumen: false,
      requiresShipping: shippingRoute.startSystem === -1 ? false : true,
      buyStation: buyStation,
      sellStructure: sellStructure
    };

    if(buyEntries.length <= 0)
      return prices;

    const usedOrders = getPriceForN(buyEntries, count);
    
    prices.singleBuyPrice = usedOrders.averagePrice;
    prices.buyPriceX = usedOrders.totalPrice;
    prices.hasEnoughMarketVolumen = usedOrders.enough;

    if (prices.requiresShipping) {
        prices.shippingCost = CalculateShippingCost(prices.singleBuyPrice, itemDetails.packaged_volume, count, shippingRoute);
    }
      

    let sellPrice = 0;

    if(sellEntries && sellEntries.length > 0) {
      sellPrice = sellEntries[0].price;
    } else {
      let singleItemShipping = 0;
      
      if (prices.requiresShipping) {
        singleItemShipping = CalculateShippingCost(prices.singleBuyPrice, itemDetails.packaged_volume, 1, shippingRoute);
      }

      const artificialPrice = usedOrders.averagePrice + ((usedOrders.averagePrice / 100) * 20) + singleItemShipping;
      sellPrice = artificialPrice;
      prices.artificialSellPrice = true;
    }
    
    prices.singleSellPrice = sellPrice;
    const sellPriceForX = prices.singleSellPrice * count;
    prices.sellPriceX = sellPriceForX;

    const brokerFee =  sellPriceForX / 100 * 2.5;
    prices.brokerFee = brokerFee;

    const saleTax = sellPriceForX / 100 * saleTaxPercent;
    prices.saleTax = saleTax;

    prices.nettoSalePrice = (sellPriceForX - brokerFee) - saleTax;
    prices.profit = (prices.nettoSalePrice - prices.buyPriceX) - prices.shippingCost;

    return prices;
}