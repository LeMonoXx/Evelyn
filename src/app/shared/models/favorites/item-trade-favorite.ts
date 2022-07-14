import { GeneralStation } from "../structure/general-station";

export interface ItemTradeFavorite {
    type_id: number;
    // type_name: string;
    buy_station: GeneralStation;
    sell_station: GeneralStation;
}