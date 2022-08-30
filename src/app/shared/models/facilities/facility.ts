export interface Facility {
    name: string,
    materialConsumptionModifier: { [identifier: number]: number; },
    structureJobCostModifier: number,
    facilityTax: number
}

const MJ5F9ECSmallMedLargeShips_byGroup: { [groupId: number]: number; } = {
    1201: 5.04, // Attack Battlecruiser 
    27:   5.04, // Battleship
    419:  5.04, // Combat Battlecruiser
    26:	  5.04, // Cruiser
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
    23:   5.04, // Starbase
    65:   5.04, // Structure
    66:   5.04  // Structure Module
  }
  
  export function getFacilitiesByItemGroup(): Facility[] {
    return [
        { name: "MJ-5F9 - EC Small Med Large Ships", structureJobCostModifier: 4, facilityTax: 10, materialConsumptionModifier: MJ5F9ECSmallMedLargeShips_byGroup },
        { name: "MJ-5F9 - EC Structures, Fuel, Components", structureJobCostModifier: 3, facilityTax: 10, materialConsumptionModifier: MJ5F9ECStructuresFuelComponents_byGroup },
    ];
  } 
  
  export function getFacilitiesByItemCategory(): Facility[] {
    return [
        { name: "MJ-5F9 - EC Structures, Fuel, Components", structureJobCostModifier: 3, facilityTax: 10, materialConsumptionModifier: MJ5F9ECStructuresFuelComponents_byCategory }
      ];
  } 