import { BlueprintDetails } from "src/app/models";

export function calculateMaterialQuantity(baseAmount: number, materialEfficiency: number) {
    // only materials with a quantity above 1 will be affected by material-efficiency
    if(baseAmount <= 1)
        return baseAmount;

    const minus = ((baseAmount / 100) * materialEfficiency);
    baseAmount = Math.ceil(baseAmount - minus);
    return baseAmount;
}

export function calculateRequiredRuns(requiredProductTypeId: number, requiredProductAmount: number, bpo: BlueprintDetails) 
    : { reqRuns: number, overflow: number } {

        const product = bpo.activities.manufacturing.products.find(p => p.typeID == requiredProductTypeId);
        let overflow = 0;
        let reqRuns = 1;

        if(product) {
          let missingAmount = requiredProductAmount - product.quantity;

          while(missingAmount > 0) {
            reqRuns++;
            missingAmount -= product.quantity;
          }

          overflow = Math.abs(missingAmount);
        } else {
            return { reqRuns: -1, overflow: 0 }
        }

        return { reqRuns, overflow }
}