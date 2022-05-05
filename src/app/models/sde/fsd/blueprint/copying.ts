import { Material } from "./material";
import { Skill } from "./skill";

export interface Copying {
    materials: Material[];
    skills: Skill[];
    time: number;
}