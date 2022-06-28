import * as moment from "moment";
import { BlueprintDetails, StationDetails, StructureDetails, EveItem } from "src/app/models";
import { ItemTradeFavorite, ShippingService, ShoppingEntry } from "..";

export const SHOPPINGENTRIES_KEY: string = "shopping-list";
export const FAVORITE_TRADE_ITEMS_KEY: string = "favorite-trade-items";
export const BLUEPRINT_DETAILS_KEY: string = "blueprint-details";
export const EVETYPE_KEY: string = "eve-types";
export const SELECTEDSTATION_KEY: string = "selected-station";
export const SELECTEDSTRUCTURE_KEY: string = "selected-structure";
export const SELECTEDSHIPPINGSERVICE_KEY: string = "selected-shipping-service"
export const BLUEPRINT_DETAILS_SAVED_DATE_KEY: string = "blueprint-details-saved-date"



export function getStoredShoppingList(): ShoppingEntry[] | null {
      return getData<ShoppingEntry[]>(SHOPPINGENTRIES_KEY);
}

export function storeShoppingList(entries: ShoppingEntry[]) {
      storeData<ShoppingEntry[]>(entries, SHOPPINGENTRIES_KEY);
}

export function getStoredFavoriteItems(): ItemTradeFavorite[] | null {
      return getData<ItemTradeFavorite[]>(FAVORITE_TRADE_ITEMS_KEY);
}

export function storeFavoriteItems(entries: ItemTradeFavorite[]) {
      storeData<ItemTradeFavorite[]>(entries, FAVORITE_TRADE_ITEMS_KEY);
}

export function getStoredBlueprintDetails(): { [typeId: number]: BlueprintDetails } | null {
      const savedTime = getData<string>(BLUEPRINT_DETAILS_SAVED_DATE_KEY);

      let refreshData = true;
      if(savedTime != null && savedTime.length > 1) {
            const savedMoment = moment(savedTime);
            const curMoment = moment(new Date());

            const daysBetween = moment.duration(curMoment.diff(savedMoment)).asDays();
            if(daysBetween < 3) {
                  refreshData = false;
            }
      }

      if(refreshData){
            console.log("StoredBlueprintDetails refresh triggered!")
            storeData<string>("", BLUEPRINT_DETAILS_KEY);
            return null;
      }


      return getData<{ [typeId: number]: BlueprintDetails }>(BLUEPRINT_DETAILS_KEY);
}

export function storeBlueprintDetails(entries: { [typeId: number]: BlueprintDetails }) {
      const savedTime = new Date().toUTCString();
      storeData<string>(savedTime, BLUEPRINT_DETAILS_SAVED_DATE_KEY);
      storeData<{ [typeId: number]: BlueprintDetails }>(entries, BLUEPRINT_DETAILS_KEY);
}

export function getStoredEveTypes(): { [typeId: number]: EveItem } | null {
      return getData<{ [typeId: number]: EveItem }>(EVETYPE_KEY);
}

export function storeEveTypes(entries: { [typeId: number]: EveItem }) {
      storeData<{ [typeId: number]: EveItem }>(entries, EVETYPE_KEY);
}

export function getStoredSelectedStation(): number | null {
      return getData<number>(SELECTEDSTATION_KEY);
}

export function storeSelectedStation(entry: StationDetails) {
      storeData<number>(entry.station_id, SELECTEDSTATION_KEY);
}

export function getStoredSelectedStructure(): number | null {
      return getData<number>(SELECTEDSTRUCTURE_KEY);
}

export function storeSelectedStructure(entry: StructureDetails) {
      storeData<number>(entry.evelyn_structureId, SELECTEDSTRUCTURE_KEY);
}

export function getStoredSelectedShippingService(): number | null {
      return getData<number>(SELECTEDSHIPPINGSERVICE_KEY);
}

export function storeSelectedShippingService(entry: ShippingService) {
      storeData<number>(entry.id, SELECTEDSHIPPINGSERVICE_KEY);
}


function storeData<T>(data: T, key: string) {
      const dataString = JSON.stringify(data);
      localStorage.setItem(key, dataString);
}

function getData<T>(key: string): T | null {
      const data = localStorage.getItem(key);

      if(data) {
            const entries = JSON.parse(data) as T;
            return entries;
      }

      return null;
}
