import { Component } from "./component";

export interface EvePraisalSearchResult {
    id: number;
    group_id: number;
    market_group_id: number;
    name: string;
    aliases?: any;
    volume: number;
    packaged_volume: number;
    base_price: number;
    blueprint_products: Component[];
    components: Component[];
    base_components: Component[];
}