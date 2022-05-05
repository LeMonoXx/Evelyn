import { Copying } from "./copying";
import { Manufacturing } from "./manufacturing";
import { ResearchMaterial } from "./research-material";
import { ResearchTime } from "./research-time";

export interface Activities {
    copying: Copying;
    manufacturing: Manufacturing;
    research_material: ResearchMaterial;
    research_time: ResearchTime; 
}