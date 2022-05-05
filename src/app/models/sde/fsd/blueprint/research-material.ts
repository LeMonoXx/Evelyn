import { Material } from "./material";
import { Skill } from "./skill";

export interface ResearchMaterial {
    materials: Material[];
    skills: Skill[];
    time: number;
}