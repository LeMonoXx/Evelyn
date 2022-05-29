import { BlueprintDetails, ItemDetails } from "src/app/models";
import { ManufacturingCalculation, ManufacturingCostEntry } from "src/app/production";

export function calculateMaterialQuantity(baseAmount: number, runs: number, materialEfficiency: number, structureRigBonus: number = 5.04, structureRoleBonus: number = 1) : number {
    // only materials with a quantity above 1 will be affected by material-efficiency
    let runsbaseAmount = baseAmount * runs;
    if(baseAmount <= 1)
        return runsbaseAmount;

    const meMinus = (runsbaseAmount / 100) * materialEfficiency;
    runsbaseAmount = runsbaseAmount - meMinus;

    let structureRoleMinus = 0;
    if(structureRoleBonus > 0) {
      structureRoleMinus =  (runsbaseAmount / 100) * structureRoleBonus;
    }

    runsbaseAmount = runsbaseAmount - structureRoleMinus;

    let structureRigMinus = 0;
    if(structureRigBonus > 0) {
      structureRigMinus = (runsbaseAmount / 100) * structureRigBonus;
    }
  
    runsbaseAmount = Math.ceil(runsbaseAmount - structureRigMinus);

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

export function getRigMaterialEfficiencyModifier(itemDetails: ItemDetails): number { 
  // const def = this.universeService.getAllGroups().pipe(
  //   tap(ids => console.log(ids)),
  //   mergeMap(ids =>
  //     from(ids).pipe(
  //       mergeMap(id => this.universeService.getItemGroup(id).pipe(
  //         mergeMap(group => this.universeService.getItemCategory(group.category_id).pipe(
  //           tap(category => console.log(`${group.group_id}: ${group.name} (${group.category_id} - ${category.name})`)))
  //         )
  //       )),
  //       toArray()
  //     )
  //   ));
  //   def.subscribe();

  const MJ5F9ECSmallMedLargeShips: { [groupId: number]: number; } = {
    1201: 5.04, // Attack Battlecruiser 
    27:   5.04, // Battleship
    419:  5.04, // Combat Battlecruiser
    26:		5.04, // Cruiser
    420:  4.20, // Destroyer
    513:  5.04, // Freighter
    25:   4.20, // Frigate
    28:   5.04, // Hauler
    941:  5.04, // Industrial Command Ship
    463:  5.04, // Mining Barge
    31:   4.20 // Shuttle
  }

  const MJ5F9ECStructuresFuelComponents: { [categoryId: number]: number; } = {
    39:   5.04, // Infrastructure Upgrades
    40:   5.04, // Sovereignty Structures:
    23: 	5.04, // Starbase:     			
    65:   5.04, // Structure: 
    66:   5.04 //	Structure Module: 
  }

  const groupValue = MJ5F9ECSmallMedLargeShips[itemDetails.group_id];

  if(groupValue != undefined) {
    return groupValue;
  }

  return 0;
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