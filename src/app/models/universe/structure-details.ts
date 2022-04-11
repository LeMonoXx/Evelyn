import { Position } from "./position";

export interface StructureDetails {
    // the stationId is not provided by the api.
    // we added it to have it, on the same object.
    evelyn_structureId: number;
    name: string;
    owner_id: number;
    position: Position;
    solar_system_id: number;
    type_id: number;
}
