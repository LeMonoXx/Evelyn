export const ACCOUNTING_SKILL_ID: number = 16622;

export const MJ5F9_REGION_ID: number = 10000066;
export const MJ5F9_SYSTEM_ID: number = 30005133;
export const MJ5F9_BEANSTAR_STRUCTURE_ID: number = 1038457641673;

export const MJ5F9_EC_StucturesFuelComponents_STRUCTURE_ID: number = 1038547343252;
export const MJ5F9_EC_SMALL_MED_LARGE_SHIPS_STRUCTURE_ID: number = 1038547286358;


export const R1OGN_BEANSTAR_STRUCTURE_ID: number = 1028081845045;

export const RQOO_SYSTEM_ID: number = 30002880;
export const RQOO_U_FORT_EQUILIBRIUM_ID: number = 1032128808152;
export const RQOO_U_EC_CAPITAL_SHIPS_STRUCTURE_ID: number = 1028489853728;
export const RQOO_U_T2_REACTIONS_STRUCTURE_ID: number = 1030903338529;
export const RQOO_U_RESEARCH_STRUCTURE_ID: number = 1028832185286;

export const TKE_REGION_ID: number = 10000034;

export const JITA_REGION_ID: number = 10000002;
export const JITA_SYSTEM_ID: number = 30000142;
export const JitaIVMoon4CaldariNavyAssemblyPlant_STATION_ID: number = 60003760;

export const PERIMETER_SYSTEM_ID: number = 30000144;
export const PerimeterTranquilityTradingTower_STATION_ID: number = 1028858195912;

export function getAllowedStationIds() : ({ station_id: number, isStructure: boolean })[] {
    return [
        // stations
        ({ station_id: JitaIVMoon4CaldariNavyAssemblyPlant_STATION_ID, isStructure: false }), 

        // structures
        ({ station_id: MJ5F9_BEANSTAR_STRUCTURE_ID, isStructure: true }), 
        ({ station_id: MJ5F9_EC_StucturesFuelComponents_STRUCTURE_ID, isStructure: true }),
        ({ station_id: MJ5F9_EC_SMALL_MED_LARGE_SHIPS_STRUCTURE_ID, isStructure: true }),
        ({ station_id: R1OGN_BEANSTAR_STRUCTURE_ID, isStructure: true }), 
        ({ station_id: RQOO_U_EC_CAPITAL_SHIPS_STRUCTURE_ID, isStructure: true }), 
        ({ station_id: RQOO_U_FORT_EQUILIBRIUM_ID, isStructure: true }),
        ({ station_id: RQOO_U_RESEARCH_STRUCTURE_ID, isStructure: true }),
        ({ station_id: RQOO_U_T2_REACTIONS_STRUCTURE_ID, isStructure: true }),
        ({ station_id: PerimeterTranquilityTradingTower_STATION_ID, isStructure: true }),
        ];
}