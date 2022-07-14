import { Position } from "./position";

export interface Constellation {
    constellation_id: number;
    name: string;
    position: Position;
    region_id: number;
    systems: number[];
}
