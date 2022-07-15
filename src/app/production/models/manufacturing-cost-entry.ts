import { GeneralStation } from "src/app/shared";

export interface ManufacturingCostEntry {
    requireShipping: boolean,
    buyLocation: GeneralStation
    typeID: number;
    itemName: string;
    quantity_total: number;
    single_buyPrice: number;
    total_buyPrice: number;
    total_volume: number;
    enoughVolume: boolean;
}