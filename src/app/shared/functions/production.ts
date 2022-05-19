export function calculateMaterialQuantity(baseAmount: number, materialEfficiency: number) {
    // only materials with a quantity above 1 will be affected by material-efficiency
    if(baseAmount <= 1)
        return baseAmount;

    const minus = ((baseAmount / 100) * materialEfficiency);
    baseAmount = Math.ceil(baseAmount - minus);
    return baseAmount;
}