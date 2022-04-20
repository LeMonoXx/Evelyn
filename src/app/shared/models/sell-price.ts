export interface SellPrice {
    type_id: number,
    type_name: string,
    quantity: number,
    singleBuyPrice: number;
    buyPriceX: number;
    // the sell price for a single item
    singleSellPrice: number;
    // the sell price for number of x item
    sellPriceX: number, 
    brokerFee: number, 
    saleTax: number, 
    nettoSalePrice: number,
    shippingCost: number,
    profit: number
}