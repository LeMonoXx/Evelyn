import { StationDetails, StructureDetails } from "src/app/models";
import { ItemIdentifier, ShoppingEntry } from "..";

export const SHOPPINGENTRIES_KEY: string = "shopping-list";
export const FAVORITEITEMS_KEY: string = "favorite-items";
export const SELECTEDSTATION_KEY: string = "selected-station"
export const SELECTEDSTRUCTURE_KEY: string = "selected-structure"

export function getStoredShoppingList(): ShoppingEntry[] | null {
      return getData<ShoppingEntry[]>(SHOPPINGENTRIES_KEY);
}

export function storeShoppingList(entries: ShoppingEntry[]) {
      storeData<ShoppingEntry[]>(entries, SHOPPINGENTRIES_KEY);
}

export function getStoredFavoriteItems(): ItemIdentifier[] | null {
      return getData<ItemIdentifier[]>(FAVORITEITEMS_KEY);
}

export function storeFavoriteItems(entries: ItemIdentifier[]) {
      storeData<ItemIdentifier[]>(entries, FAVORITEITEMS_KEY);
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
