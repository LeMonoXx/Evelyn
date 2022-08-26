import { JITA_SYSTEM_ID, JVFID_SYSTEM_ID, MJ5F9_SYSTEM_ID, O34MN_SYSTEM_ID, PERIMETER_SYSTEM_ID, RQOO_SYSTEM_ID, ShippingRoute } from "../..";

export interface ShippingService {
    id: number,
    serviceName: string,
    routes: ShippingRoute[]
}

export function getShippingServices() : ShippingService[] {
    const noShipping = ({ id: 0, serviceName: "-- No shipping --", routes: [({startSystem: -1, endSystem: -1, cubicMeterPrice: 0, collateral: 0, maxVolume: 0, maxCollateral: 0})] });
    const beanFreight = ({ id: 1, serviceName: "Bean Freight", routes: getBeanFreightRoutes() });
    const lemmings = ({ id: 2, serviceName: "Multi-Lemm Logistics", routes: getLemmingRoutes() });

    return [noShipping,beanFreight, lemmings]
}

function getBeanFreightRoutes() : ShippingRoute[] {
    const beanFreightRoutes = 
        [
            ({ startSystem: JITA_SYSTEM_ID, endSystem: MJ5F9_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // Jita -> MJ
            ({ startSystem: MJ5F9_SYSTEM_ID, endSystem: JITA_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // MJ - Jita

            ({ startSystem: JITA_SYSTEM_ID, endSystem: O34MN_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // Jita -> O3-4MN
            ({ startSystem: O34MN_SYSTEM_ID, endSystem: JITA_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // O3-4MN - Jita

            ({ startSystem: JITA_SYSTEM_ID, endSystem: JVFID_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // Jita -> JVF-ID
            ({ startSystem: JVFID_SYSTEM_ID, endSystem: JITA_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // JVF-ID - Jita

            ({ startSystem: JITA_SYSTEM_ID, endSystem: RQOO_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // Jita -> RQOO-U
            ({ startSystem: RQOO_SYSTEM_ID, endSystem: JITA_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // RQOO-U - Jita
            
            ({ startSystem: PERIMETER_SYSTEM_ID, endSystem: MJ5F9_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 }),   // Perimeter -> MJ
            ({ startSystem: MJ5F9_SYSTEM_ID, endSystem: PERIMETER_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 })    // MJ - Perimeter
        ];

        return beanFreightRoutes;
}

function getLemmingRoutes() : ShippingRoute[] {
    const lemmingRoutes = 
    [
        ({ startSystem: JITA_SYSTEM_ID, endSystem: MJ5F9_SYSTEM_ID, cubicMeterPrice: 400, collateral: 1.0,  maxVolume: 350000, maxCollateral: 20000000000 }),   // Jita -> MJ
        ({ startSystem: MJ5F9_SYSTEM_ID, endSystem: JITA_SYSTEM_ID, cubicMeterPrice: 400, collateral: 1.0,  maxVolume: 150000, maxCollateral: 5000000000 }),     // MJ - Jita
        
        ({ startSystem: PERIMETER_SYSTEM_ID, endSystem: MJ5F9_SYSTEM_ID, cubicMeterPrice: 400, collateral: 1.0, maxVolume: 350000, maxCollateral: 20000000000 }),   // Perimeter -> MJ
        ({ startSystem: MJ5F9_SYSTEM_ID, endSystem: PERIMETER_SYSTEM_ID, cubicMeterPrice: 400, collateral: 1.0, maxVolume: 150000, maxCollateral: 5000000000 }),    // MJ - Perimeter

        ({ startSystem: JITA_SYSTEM_ID, endSystem: O34MN_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 350000, maxCollateral: 20000000000 }),   // Jita -> O3-4MN
        ({ startSystem: O34MN_SYSTEM_ID, endSystem: JITA_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0, maxVolume: 150000, maxCollateral: 5000000000 }),   // O3-4MN - Jita

        ({ startSystem: JITA_SYSTEM_ID, endSystem: JVFID_SYSTEM_ID, cubicMeterPrice: 400, collateral: 1.0, maxVolume: 350000, maxCollateral: 20000000000 }),   // Jita -> JVF-ID
        ({ startSystem: JVFID_SYSTEM_ID, endSystem: JITA_SYSTEM_ID, cubicMeterPrice: 400, collateral: 1.0, maxVolume: 150000, maxCollateral: 5000000000 }),   // JVF-ID - Jita

        ({ startSystem: MJ5F9_SYSTEM_ID, endSystem: O34MN_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0,  maxVolume: 350000, maxCollateral: 20000000000 }),   // MJ - O3-4MN
        ({ startSystem: O34MN_SYSTEM_ID, endSystem: MJ5F9_SYSTEM_ID, cubicMeterPrice: 300, collateral: 1.0,  maxVolume: 350000, maxCollateral: 20000000000 }),   // O3-4MN - MJ

        ({ startSystem: JITA_SYSTEM_ID, endSystem: RQOO_SYSTEM_ID, cubicMeterPrice: 400, collateral: 1.0, maxVolume: 350000, maxCollateral: 20000000000 }),   // Jita -> RQOO-U
        ({ startSystem: RQOO_SYSTEM_ID, endSystem: JITA_SYSTEM_ID, cubicMeterPrice: 400, collateral: 1.0, maxVolume: 150000, maxCollateral: 50000000000 }),   // RQOO-U - Jita

    ];
    
    return lemmingRoutes;
}