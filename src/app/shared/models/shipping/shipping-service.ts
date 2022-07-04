export interface ShippingService {
    id: number,
    serviceName: string,
    routes: ShippingRoute[]
}

export interface ShippingRoute {
    startSystem: number,
    endSystem: number,
    cubicMeterPrice: number,
    collateral: number,
    maxVolume: number,
    maxCollateral: number
}

export function getAllowedShippingServices() : ShippingService[] {
    const noShipping = ({ id: 0, serviceName: "-- No shipping --", routes: [({startSystem: -1, endSystem: -1, cubicMeterPrice: 0, collateral: 0, maxVolume: 0, maxCollateral: 0})] });
    const beanFreight = ({ id: 1, serviceName: "Bean Freight", routes: getBeanFreightRoutes() });
    const lemmings = ({ id: 2, serviceName: "Multi-Lemm Logistics", routes: getLemmingRoutes() });

    return [noShipping,beanFreight, lemmings]
}

function getBeanFreightRoutes() : ShippingRoute[] {
    const beanFreightRoutes = 
        [
            ({ startSystem: 30000142, endSystem: 30005133, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // Jita -> MJ
            ({ startSystem: 30005133, endSystem: 30000142, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),    // MJ - Jita
            
            ({ startSystem: 30000144, endSystem: 30005133, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // Perimeter -> MJ
            ({ startSystem: 30005133, endSystem: 30000144, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 })    // MJ - Perimeter
        ];

        return beanFreightRoutes;
}

function getLemmingRoutes() : ShippingRoute[] {
    const lemmingRoutes = 
    [
        ({ startSystem: 30000142, endSystem: 30005133, cubicMeterPrice: 620, collateral: 1.5,  maxVolume: 350000, maxCollateral: 20000000000 }),   // Jita -> MJ
        ({ startSystem: 30005133, endSystem: 30000142, cubicMeterPrice: 620, collateral: 1.5,  maxVolume: 150000, maxCollateral: 5000000000 })     // MJ - Jita
    ];
    
    return lemmingRoutes;
}