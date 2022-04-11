export interface SellPrice {
    // the sell price for a single item
    sellPrice: number;
    // the sell price for number of x item
    grossSellPrice: number, 
    brokerFee: number, 
    saleTax: number, 
    nettoSalePrice: number,
    profit: number,
    shippingCost: number,
    afterShippingProfit: number
}