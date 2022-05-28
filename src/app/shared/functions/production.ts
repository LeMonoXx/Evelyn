import { BlueprintDetails } from "src/app/models";
import { ManufacturingCalculation, ManufacturingCostEntry } from "src/app/production";

export function calculateMaterialQuantity(baseAmount: number, runs: number, materialEfficiency: number, structureRigBonus: number = 5, structureRoleBonus: number = 1) : number {
    // only materials with a quantity above 1 will be affected by material-efficiency
    let runsbaseAmount = baseAmount * runs;
    if(baseAmount <= 1)
        return runsbaseAmount;

    console.log("baseAmount ", baseAmount);

    const meMinus = (runsbaseAmount / 100) * materialEfficiency;
    const afterMeAmount = Math.ceil(runsbaseAmount - meMinus);
    console.log("afterMeAmount ", afterMeAmount);

    const baseOnePercent = (afterMeAmount / 100);

    console.log("baseOnePercent ", baseOnePercent);

    let structureRoleMinus = 0;
    if(structureRoleBonus > 0) {
      structureRoleMinus = baseOnePercent * structureRoleBonus;
      console.log("structureRoleMinus ", structureRoleMinus);
    }

    runsbaseAmount = Math.ceil(afterMeAmount - structureRoleMinus);

    let structureRigMinus = 0;
    // if(structureRigBonus > 0) {
    //   structureRigMinus = baseOnePercent * structureRigBonus;
    //   console.log("structureRigMinus ", structureRigMinus);
    // }
  
    runsbaseAmount = Math.ceil(runsbaseAmount - structureRigMinus);

    console.log("runsbaseAmount ", runsbaseAmount);
    console.log("---------");

    return runsbaseAmount;
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

export function calculateTotalVolume(manufacturing : ManufacturingCalculation[]) {

  let volume = 0;

  manufacturing.forEach(entry => volume += calculateComponentVolume(entry.bpoCost));

  return volume;
}

export function calculateComponentVolume(costEntries : ManufacturingCostEntry[]) {
  let volume = 0;
  costEntries.forEach(cost => volume += cost.total_volume);
  return volume;
}

export function calculateTotalCosts(manufacturing : ManufacturingCalculation[]) {

  let price = 0;

  manufacturing.forEach(entry => price += calculateComponentCosts(entry.bpoCost));

  return price;
}

export function calculateComponentCosts(costEntries : ManufacturingCostEntry[]) {
  let price = 0;
  costEntries.forEach(cost => price += cost.total_buyPrice);
  return price;
}