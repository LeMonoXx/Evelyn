import { BlueprintDetails, ItemDetails, Material } from "src/app/models";
import { ItemCategory } from "src/app/models/universe/categories/item-category";
import { Facility } from "src/app/shared/models/facilities/facility";

export interface SubComponent {
    material: Material, 
    item: ItemDetails,
    itemCategory: ItemCategory,
    requiredRuns?: number,
    requiredAmount: number,
    overflow: number,
    bpo?: BlueprintDetails,
    IEV?: number,
    jobCost?: number,
    bpoItem?: ItemDetails,
    prodFacility?: Facility
}