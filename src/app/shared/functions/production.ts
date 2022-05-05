export function calculateMaterialQuantity(baseAmount: number, materialEfficiency: number) {
    const minus = ((baseAmount / 100) * materialEfficiency);
    baseAmount = Math.ceil(baseAmount - minus);
    return baseAmount;
}