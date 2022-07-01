import { BlueprintDetails, ItemDetails } from "src/app/models";
import { ItemCategory } from "src/app/models/universe/categories/item-category";
import { ManufacturingCalculation, ManufacturingCostEntry, SubComponent } from "src/app/production";
import { Facility } from "../models/facilities/facility";

const MJ5F9ECSmallMedLargeShips_byGroup: { [groupId: number]: number; } = {
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
  31:   4.20  // Shuttle
}

const MJ5F9ECStructuresFuelComponents_byGroup: { [categoryId: number]: number } = {
  332:  4.20, // Tool
  334:  4.20, // Construction Components
  913:  4.20, // Advanced Capital Construction Components
}

const MJ5F9ECStructuresFuelComponents_byCategory: { [categoryId: number]: number } = {
  39:   5.04, // Infrastructure Upgrades
  40:   5.04, // Sovereignty Structures
  23: 	5.04, // Starbase
  65:   5.04, // Structure
  66:   5.04  // Structure Module
}

const facilitiesByItemGroup: Facility[] = [
  { name: "MJ-5F9 - EC Small Med Large Ships", structureJobCostModifier: 4, facilityTax: 10, materialConsumptionModifier: MJ5F9ECSmallMedLargeShips_byGroup },
  { name: "MJ-5F9 - EC Structures, Fuel, Components", structureJobCostModifier: 3, facilityTax: 10, materialConsumptionModifier: MJ5F9ECStructuresFuelComponents_byGroup },
]

const facilitiesByItemCategory: Facility[] = [
  { name: "MJ-5F9 - EC Structures, Fuel, Components", structureJobCostModifier: 3, facilityTax: 10, materialConsumptionModifier: MJ5F9ECStructuresFuelComponents_byCategory }
]

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
    for(let i=0; i < facilitiesByItemGroup.length; i++) {
      const facility = facilitiesByItemGroup[i];
      const groupValue = facility.materialConsumptionModifier[itemDetails.group_id];

      if(groupValue != undefined) {
        return { modifier: groupValue, facility: facility };
      }
    }

    for(let i=0; i < facilitiesByItemCategory.length; i++) {
      const facility = facilitiesByItemCategory[i];
      const categoryValue = facility.materialConsumptionModifier[itemCategory.category_id];

      if(categoryValue != undefined) {
        return { modifier: categoryValue, facility: facility };
      }
    }

    return  { modifier: 0, facility: facilitiesByItemGroup[facilitiesByItemGroup.length - 1] };
}

export function calculateTotalJobCosts(manufacturing : ManufacturingCalculation[], systemCostIndex: number, structureRoleBonus: number, facilityTax: number): number {
  let cost = 0;
  manufacturing.forEach(entry => {
    if(entry.subComponent && entry.subComponent.IEV && entry.subComponent.prodFacility)
      cost += calculateJobCost(entry.subComponent?.IEV, systemCostIndex, entry.subComponent.prodFacility);
  });

  return cost;
}

export function calculateJobCost(totalBpoIEV: number, systemCostIndex: number, facility: Facility): number {
  const systemCostMargin = totalBpoIEV * systemCostIndex; // e.g. 0.0554
  const structureRoleMargin = (systemCostMargin / 100) * facility.structureJobCostModifier;
  const jobGrossCost = systemCostMargin - structureRoleMargin;

  const taxMargin = (jobGrossCost / 100) * facility.facilityTax;
  const cost = jobGrossCost + taxMargin;
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