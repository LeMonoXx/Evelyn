export const ACCOUNTING_SKILL_ID: number = 16622;

export const MJ5F9BEANSTAR_STRUCTURE_ID: number = 1038457641673;
export const MJ5F9_REGION_ID: number = 10000066;

export const R1OGNBEANSTAR_STRUCTURE_ID: number = 1028081845045;
export const R1OGN_REGION_ID: number = 10000034;

export const JITA_REGION_ID: number = 10000002;

export const JitaIVMoon4CaldariNavyAssemblyPlant_STATION_ID: number = 60003760;

export function getAllowedStationIds() : number[] {
    return [JitaIVMoon4CaldariNavyAssemblyPlant_STATION_ID];
}

export function getAllowedStructureIds() : number[] {
    return [MJ5F9BEANSTAR_STRUCTURE_ID, R1OGNBEANSTAR_STRUCTURE_ID];
}