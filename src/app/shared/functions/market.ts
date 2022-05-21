import { MarketEntry } from "src/app/models";

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