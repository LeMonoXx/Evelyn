import { BlueprintDetails, ItemDetails, Material } from "src/app/models";

export interface SubComponent {
    material: Material, 
    item: ItemDetails,
    requiredRuns?: number,
    requiredAmount?: number,
    bpo?: BlueprintDetails,
    bpoItem?: ItemDetails,
    prodFacility?: number
}