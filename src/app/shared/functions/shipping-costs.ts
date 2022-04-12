  export function CalculateShippingCost(singleItemBuyCost: number, cubicMeters: number, itemCount: number, cubicMeterPrice: number = 550) : number {
    var costs = ((singleItemBuyCost * itemCount) / 100 ) * 1.5 + ((itemCount * cubicMeters) * cubicMeterPrice)

    return costs;
  }