import { BlueprintDetails, ItemDetails } from "src/app/models";
import { ItemCategory } from "src/app/models/universe/categories/item-category";
import { ManufacturingCostEntry } from "src/app/production";
import { Facility, getFacilitiesByItemCategory, getFacilitiesByItemGroup } from "../models/facilities/facility";

export function calculateMaterialQuantity(
  baseAmount: number, 
  runs: number, 
  materialEfficiency: number, 
  structureRigBonus: number, 
  structureRoleBonus: number = 1) : number {
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

export function getRigMEforItem(itemDetails: ItemDetails, itemCategory: ItemCategory): { modifier: number, facility: Facility } {
  var facilitiesByItemGroup = getFacilitiesByItemGroup();

    for(let i=0; i < facilitiesByItemGroup.length; i++) {
      const facility = facilitiesByItemGroup[i];
      const groupValue = facility.materialConsumptionModifier[itemDetails.group_id];

      if(groupValue != undefined) {
        return { modifier: groupValue, facility: facility };
      }
    }

    var facilitiesByItemCategory = getFacilitiesByItemCategory();

    for(let i=0; i < facilitiesByItemCategory.length; i++) {
      const facility = facilitiesByItemCategory[i];
      const categoryValue = facility.materialConsumptionModifier[itemCategory.category_id];

      if(categoryValue != undefined) {
        return { modifier: categoryValue, facility: facility };
      }
    }

    return  { modifier: 0, facility: facilitiesByItemGroup[facilitiesByItemGroup.length - 1] };
}

export function calculateJobCost(bpoIEV: number, runs: number, systemCostIndex: number, facility: Facility): number {

  const allrunsIEV = bpoIEV * runs;
  const systemCostMargin = Math.ceil(allrunsIEV * systemCostIndex); // e.g. 0.0554
  const structureRoleMargin = Math.ceil((systemCostMargin / 100) * facility.structureJobCostModifier);
  const jobGrossCost = systemCostMargin - structureRoleMargin;
  const taxMargin = Math.ceil((jobGrossCost / 100) * facility.facilityTax);
  const cost = jobGrossCost + taxMargin
  return cost;
}

export function calculateShippingComponentVolume(costEntries : ManufacturingCostEntry[]) {
  let volume = 0;
  costEntries.filter(e => e.requireShipping).forEach(cost => volume += cost.total_volume);
  return volume;
}

export function calculateComponentVolume(costEntries : ManufacturingCostEntry[]) {
  let volume = 0;
  costEntries.forEach(cost => volume += cost.total_volume);
  return volume;
}

export function calculateComponentMaterialCosts(costEntries : ManufacturingCostEntry[]) {
  let price = 0;
  costEntries.forEach(cost => price += cost.total_buyPrice);
  return price;
}

export function calculateComponentShippingColaterial(costEntries : ManufacturingCostEntry[]) {
  let price = 0;
  costEntries.filter(e => e.requireShipping).forEach(cost => price += cost.total_buyPrice);
  return price;
}