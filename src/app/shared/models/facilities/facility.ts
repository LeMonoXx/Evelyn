export interface Facility {
    name: string,
    materialConsumptionModifier: { [identifier: number]: number; },
    structureJobCostModifier: number,
    facilityTax: number
}