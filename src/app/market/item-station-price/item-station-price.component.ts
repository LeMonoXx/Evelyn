import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Console } from 'console';
import { combineLatest, debounceTime, map, mergeMap, Observable, switchMap } from 'rxjs';
import { ItemDetails, MarketEntry, StationDetails, StructureDetails } from 'src/app/models';
import { CalculateShippingCost, copyToClipboard, FavoritesService, ItemIdentifier, 
  JITA_REGION_ID, MarketService, TradeCalculation, 
  ShoppingEntry, ShoppingListService, UniverseService, getPriceForN } from 'src/app/shared';

@Component({
  selector: 'eve-item-station-price',
  templateUrl: './item-station-price.component.html',
  styleUrls: ['./item-station-price.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItemStationPriceComponent implements OnInit {

  @Input()
  public saleTaxPercent$: Observable<number>;
  @Input()
  public numberCount$ : Observable<number>;
  @Input()
  public buyStation$: Observable<StationDetails>;
  @Input()
  public sellStation$ : Observable<StructureDetails>;
  @Input()
  public itemIdentifier$: Observable<ItemIdentifier>;
  @Input()
  public itemDetails$: Observable<ItemDetails>
  
  public itemBuyCostObs: Observable<MarketEntry[]>;
  public itemSellCostObs$: Observable<MarketEntry[]>;
  public tradeData$: Observable<TradeCalculation>;
  public currentItemImageSourceObs: Observable<string>;


  constructor(
    private marketService: MarketService, 
    private universeService: UniverseService,
    private shopphingListService: ShoppingListService,
    private favoriteService: FavoritesService,
    private snackBar: MatSnackBar) {

   }

  ngOnInit(): void {

    this.currentItemImageSourceObs = this.itemIdentifier$.pipe(
      map(item => {
        return this.universeService.getImageUrlForType(item.id, 64);
      }));

      this.itemBuyCostObs = this.buyStation$.pipe(
        switchMap(station => this.itemIdentifier$.pipe(
          switchMap(item => this.marketService.getRegionMarketForItem(item.id, JITA_REGION_ID).pipe(
            // we get the market for the whole region. But we only want Jita.
            map(entries => entries.filter(entry => entry.location_id === station.station_id))
          ))
        )));
        

      this.itemSellCostObs$ = combineLatest([this.sellStation$, this.itemIdentifier$]).pipe(
        debounceTime(100),
        mergeMap(([sellStation, itemIdentifier]) =>  
          this.marketService.getStructureMarketForItem(sellStation.evelyn_structureId, itemIdentifier.id, false)
        ));

        this.tradeData$ = 
        combineLatest(
          [
            this.numberCount$, 
            this.itemBuyCostObs, 
            this.itemDetails$, 
            this.itemSellCostObs$,
            this.saleTaxPercent$
          ]).pipe(
            map((
              [
                count, 
                buyEntries, 
                itemDetails, 
                sellEntries,
                saleTaxPercent
              ]) => {
            const prices: TradeCalculation = {
              quantity: count,
              type_id: itemDetails.type_id,
              type_name: itemDetails.name,
              singleBuyPrice: 0,
              buyPriceX: 0,
              singleSellPrice: 0,
              sellPriceX: 0,
              artificialSellPrice: false,
              brokerFee: 0,
              saleTax: 0,
              nettoSalePrice: 0,
              profit: 0,
              shippingCost: 0,
              usedMarketEntries: [],
              hasEnoughMarketVolumen: false
            };
          const usedOrders = getPriceForN(buyEntries, count);
          
          prices.singleBuyPrice = usedOrders.averagePrice;
          console.log("singleBuyPrice: ", prices.singleBuyPrice);
          
          prices.buyPriceX = usedOrders.totalPrice;
          prices.hasEnoughMarketVolumen = usedOrders.enough;
        
          prices.shippingCost = CalculateShippingCost(prices.singleBuyPrice, itemDetails.packaged_volume, count);

          let sellPrice = 0;

          if(sellEntries && sellEntries.length > 0) {
            sellPrice = sellEntries[0].price;
          } else {
            const singleItemShipping = CalculateShippingCost(prices.singleBuyPrice, itemDetails.packaged_volume, 1);
            const artificialPrice = usedOrders.averagePrice + ((usedOrders.averagePrice / 100) * 20) + singleItemShipping;
            sellPrice = artificialPrice;
            prices.artificialSellPrice = true;
          }
          
          prices.singleSellPrice = sellPrice;
          const sellPriceForX = prices.singleSellPrice * count;
          prices.sellPriceX = sellPriceForX;

          const brokerFee =  sellPriceForX / 100 * 2.5;
          prices.brokerFee = brokerFee;

          const saleTax = sellPriceForX / 100 * saleTaxPercent;
          prices.saleTax = saleTax;

          prices.nettoSalePrice = (sellPriceForX - brokerFee) - saleTax;
          prices.profit = (prices.nettoSalePrice - prices.buyPriceX) - prices.shippingCost;

          return prices;
        }));
  }

  public IsOnShoppingList(type_id: number): boolean {
    return this.shopphingListService.ContainsItem(type_id);
  }

  public addOrRemoveShoppingList(sell: TradeCalculation) {
    const existingEntry = this.shopphingListService.GetEntryById(sell.type_id);

    if(!existingEntry) {
      const shoppingEntry: ShoppingEntry = {
        quantity: sell.quantity,
        type_id: sell.type_id,
        item_name: sell.type_name,
        buy_price: sell.singleBuyPrice,
        sell_price: sell.singleSellPrice,
        profit: sell.profit
      }

      this.shopphingListService.AddShoppingEntry(shoppingEntry);
      
    } else {
      this.shopphingListService.RemoveShoppingEntry(existingEntry);
    }
  }

  public addOrRemoveFavorite(item: ItemIdentifier) {
    const existingEntry = this.favoriteService.GetEntryById(item.id);

    if(!existingEntry) {
      this.favoriteService.AddFavoriteItem(item);  
    } else {
      this.favoriteService.RemoveFavoriteItem(existingEntry);
    }
  }

  public IsFavorite(type_id: number): boolean {
    return this.favoriteService.ContainsItem(type_id);
  }
 
  public copy(text: string) {
    copyToClipboard(text);

    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
}