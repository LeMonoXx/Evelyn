import { Material } from "./material";
import { Skill } from "./skill";

export interface ResearchTime {
    materials: Material[];
    skills: Skill[];
    time: number;
}