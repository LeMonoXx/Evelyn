export interface ShoppingEntry {
    quantity: number;
    type_id: number;
    item_name: string;
    buy_price: number;
    sell_price: number;
    profit: number;
    // when we add items for production we do not have a price calculation
    // with this information, we can even ehance them visually (or sort them out)
    forProduction: boolean;
}