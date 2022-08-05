import { Description } from "./description";
import { Name } from "./name";

export interface EveItem {
    typeId: number,
    // description: Description;
    // groupID: number;
    // iconID: number;
    // marketGroupID: number;
    // mass: number;
    name?: string;
    // portionSize: number;
    // published: boolean;
    // variationParentTypeID: number;
    // volume: number;
    order: number;
}