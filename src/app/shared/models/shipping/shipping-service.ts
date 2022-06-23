export interface ShippingService {
    id: number,
    serviceName: string,
    cubicMeterPrice: number,
    collateral: number,
    maxVolume: number,
    maxCollateral: number
}


export function getAllowedShippingServices() : ShippingService[] {
    const noShipping = ({ id: 0, serviceName: "-- No shipping --", cubicMeterPrice: 0, collateral: 0, maxVolume: 0, maxCollateral: 0 });
    const beanFreight = ({ id: 1, serviceName: "Bean Freight", cubicMeterPrice: 300, collateral: 1.0, maxVolume: 360000, maxCollateral: 50000000000 });
    const lemmings = ({ id: 2, serviceName: "Multi-Lemm Logistics", cubicMeterPrice: 620, collateral: 1.5,  maxVolume: 350000, maxCollateral: 20000000000 });

    return [noShipping,beanFreight, lemmings]
}