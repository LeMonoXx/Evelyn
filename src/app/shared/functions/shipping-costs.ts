  export function CalculateShippingCost(singleItemBuyCost: number, cubicMeters: number, itemCount: number, cubicMeterPrice: number = 620) : number {
    var costs = ((singleItemBuyCost * itemCount) / 100 ) * 1.5 + ((itemCount * cubicMeters) * cubicMeterPrice)

    return costs;
  }

  export function CalculateShippingCostForBundle(totalBundleCost: number, totalCubicMeters: number, cubicMeterPrice: number = 620) : number {
    var costs = (totalBundleCost / 100 ) * 1.5 + (totalCubicMeters * cubicMeterPrice)

    return costs;
  }