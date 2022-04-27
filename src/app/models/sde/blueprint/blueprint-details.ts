import { Activities } from "./activities";

export interface BlueprintDetails {
    activities: Activities;
    blueprintTypeID: number;
    maxProductionLimit: number;
}