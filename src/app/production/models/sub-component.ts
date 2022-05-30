import { BlueprintDetails, ItemDetails, Material } from "src/app/models";
import { ItemCategory } from "src/app/models/universe/categories/item-category";

export interface SubComponent {
    material: Material, 
    item: ItemDetails,
    itemCategory: ItemCategory,
    requiredRuns?: number,
    requiredAmount?: number,
    overflow: number,
    bpo?: BlueprintDetails,
    bpoItem?: ItemDetails,
    prodFacilityName?: string
}