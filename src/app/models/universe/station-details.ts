import { Position } from "./position";

export interface StationDetails {
    max_dockable_ship_volume: number;
    name: string;
    office_rental_cost: number;
    owner: number;
    position: Position;
    race_id: number;
    reprocessing_efficiency: number;
    reprocessing_stations_take: number;
    services: string[];
    station_id: number;
    system_id: number;
    type_id: number;
}

