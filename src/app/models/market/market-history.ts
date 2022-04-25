export interface MarketHistory {
    average: number;
    // we convert the date-string to a actual date object when receving the data.
    evelyn_date: Date;
    date: string;
    highest: number;
    lowest: number;
    order_count: number;
    volume: number;
}