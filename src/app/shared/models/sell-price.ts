export interface SellPrice {
    grossSellPrice: number, 
    brokerFee: number, 
    saleTax: number, 
    nettoSalePrice: number,
    profit: number,
    shippingCost: number,
    afterShippingProfit: number
}