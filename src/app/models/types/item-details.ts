import { DogmaAttribute } from "./dogma-attribute";
import { DogmaEffect } from "./dogma-effect";

export interface ItemDetails {
    capacity: number;
    description: string;
    dogma_attributes: DogmaAttribute[];
    dogma_effects: DogmaEffect[];
    graphic_id: number;
    group_id: number;
    market_group_id: number;
    mass: number;
    name: string;
    packaged_volume: number;
    portion_size: number;
    published: boolean;
    radius: number;
    type_id: number;
    volume: number;
}


