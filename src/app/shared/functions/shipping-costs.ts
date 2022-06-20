import { ShippingService } from "../models/shipping/shipping-service";

  export function CalculateShippingCost(singleItemBuyCost: number, cubicMeters: number, itemCount: number, shippingService: ShippingService) : number {
    var costs = ((singleItemBuyCost * itemCount) / 100 ) * shippingService.collateral + ((itemCount * cubicMeters) * shippingService.cubicMeterPrice)

    return costs;
  }

  export function CalculateShippingCostForBundle(totalBundleCost: number, totalCubicMeters: number, shippingService: ShippingService) : number {
    var costs = (totalBundleCost / 100 ) * shippingService.collateral + (totalCubicMeters * shippingService.cubicMeterPrice)

    return costs;
  }