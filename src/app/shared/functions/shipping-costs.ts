import { GeneralStation, ShippingRoute, ShippingService } from "..";

export function ShippingServicesHasRoute(service: ShippingService, startStation: GeneralStation, endStructure: GeneralStation) : boolean {
  const hasRoute = service.routes.find(r => r.startSystem === startStation.solar_system_id && r.endSystem === endStructure.solar_system_id);
  return hasRoute !== undefined;
}

export function GetShippingRoute(service: ShippingService, startStation: GeneralStation, endStructure: GeneralStation) : ShippingRoute {
  const route = service.routes.find(r => r.startSystem === startStation.solar_system_id && r.endSystem === endStructure.solar_system_id);

  if(route)
    return route;
  
  throw("not route found for given start and end.")
}

  export function CalculateShippingCost(singleItemBuyCost: number, cubicMeters: number, itemCount: number, shippingRoute: ShippingRoute) : number {
    var costs = ((singleItemBuyCost * itemCount) / 100 ) * shippingRoute.collateral + ((itemCount * cubicMeters) * shippingRoute.cubicMeterPrice)

    return costs;
  }

  export function CalculateShippingCostForBundle(totalBundleCost: number, totalCubicMeters: number, route: ShippingRoute) : number {
    var costs = (totalBundleCost / 100 ) * route.collateral + (totalCubicMeters * route.cubicMeterPrice)

    return costs;
  }