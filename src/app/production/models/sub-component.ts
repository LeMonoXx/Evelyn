import { BlueprintDetails, ItemDetails, Material } from "src/app/models";

export interface SubComponent {
    material: Material, 
    item: ItemDetails,
    requiredAmount?: number,
    bpo?: BlueprintDetails,
    bpoItem?: ItemDetails
}