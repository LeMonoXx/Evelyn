export interface MarketEntry {
    duration: number;
    is_buy_order: boolean;
    issued: Date;
    location_id: any;
    min_volume: number;
    order_id: any;
    price: number;
    range: string;
    type_id: number;
    volume_remain: number;
    volume_total: number;
}