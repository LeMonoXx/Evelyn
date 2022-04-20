import { Skill } from "./skill";

export interface CharacterSkills {
    skills: Skill[];
    total_sp: number;
    unallocated_sp: number;
}
