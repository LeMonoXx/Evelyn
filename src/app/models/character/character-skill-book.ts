import { CharacterSkill } from "./character-skill";

export interface CharacterSkillBook {
    skills: CharacterSkill[];
    total_sp: number;
    unallocated_sp: number;
}
