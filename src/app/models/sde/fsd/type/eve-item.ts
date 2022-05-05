import { Description } from "./description";
import { Name } from "./name";

export interface EveItem {
    description: Description;
    groupID: number;
    iconID: number;
    marketGroupID: number;
    mass: number;
    name: Name;
    portionSize: number;
    published: boolean;
    variationParentTypeID: number;
    volume: number;
}