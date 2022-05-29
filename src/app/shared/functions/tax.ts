export function calculateTaxPercentBySkillLevel(skill_level: number) : number {
    const result = 8 - (8 / 100 * skill_level * 11)
    return result;
}