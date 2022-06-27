export interface CostIndice {
    activity: string;
    cost_index: number;
}

export interface IndustrySystem {
    cost_indices: CostIndice[];
    solar_system_id: number;
}