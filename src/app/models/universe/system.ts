import { Planet } from "./planet";
import { Position } from "./position";

export interface System {
    constellation_id: number;
    name: string;
    planets: Planet[];
    position: Position;
    security_class: string;
    security_status: number;
    star_id: number;
    stargates: number[];
    stations: number[];
    system_id: number;
}
