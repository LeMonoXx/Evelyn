import { ItemDetails } from "src/app/models";
import { ManufacturingCostEntry } from "./manufacturing-cost-entry";
import { SubComponent } from "./sub-component";

export interface ManufacturingCalculation {
    item: ItemDetails, 
    reqAmount?: number, 
    subComponent?: SubComponent,
    bpoCost: ManufacturingCostEntry[]
}