export interface MarketOrder {
    duration: number;
    escrow: number;
    is_buy_order: boolean;
    is_corporation: boolean;
    issued: Date;
    location_id: any;
    min_volume: number;
    order_id: any;
    price: number;
    range: string;
    region_id: number;
    type_id: number;
    volume_remain: number;
    volume_total: number;
}