import { StationDetails, StructureDetails } from "src/app/models";

export interface ManufacturingCostEntry {
    requireShipping: boolean,
    buyLocation: StationDetails | StructureDetails
    typeID: number;
    itemName: string;
    quantity_total: number;
    single_buyPrice: number;
    total_buyPrice: number;
    total_volume: number;
    enoughVolume: boolean;
}