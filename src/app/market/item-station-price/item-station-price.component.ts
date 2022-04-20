import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { combineLatest, map, mergeMap, Observable, switchMap } from 'rxjs';
import { ItemDetails, MarketEntry, StationDetails, StructureDetails } from 'src/app/models';
import { CalculateShippingCost, copyToClipboard, FavoritesService, ItemIdentifier, MarketService, SellPrice, ShoppingEntry, ShoppingListService, UniverseService } from 'src/app/shared';

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
  public sellStation$ : Observable<StructureDetails>; //1038457641673
  @Input()
  public itemIdentifier$: Observable<ItemIdentifier>;
  @Input()
  public itemDetails$: Observable<ItemDetails>
  
  public itemBuyCostObs: Observable<MarketEntry[]>;
  public itemSellCostObs$: Observable<MarketEntry[]>;
  public calculatedSellData$: Observable<SellPrice>;
  public currentItemImageSourceObs: Observable<string>;


  constructor(
    private marketService: MarketService, 
    private universeService: UniverseService,
    private shopphingListService: ShoppingListService,
    private favoriteService: FavoritesService) {

   }

  ngOnInit(): void {
    this.currentItemImageSourceObs = this.itemIdentifier$.pipe(
      map(item => {
        return this.universeService.getImageUrlForType(item.id, 64);
      }));

      this.itemBuyCostObs = this.itemIdentifier$.pipe(
        switchMap(item => this.marketService.getRegionMarketForItem(item.id))
        );
        

      this.itemSellCostObs$ = combineLatest([this.sellStation$, this.itemIdentifier$]).pipe(
        mergeMap(([sellStation, itemIdentifier]) =>  
          this.marketService.getStructureMarketForItem(sellStation.evelyn_structureId, itemIdentifier.id, false)
        ));

        this.calculatedSellData$ = 
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
            const prices: SellPrice = {
              quantity: count,
              type_id: itemDetails.type_id,
              type_name: itemDetails.name,
              singleBuyPrice: 0,
              buyPriceX: 0,
              singleSellPrice: 0,
              sellPriceX: 0,
              brokerFee: 0,
              saleTax: 0,
              nettoSalePrice: 0,
              profit: 0,
              shippingCost: 0
            };

          // the buyEntries are not actual "Buy-Orders".
          // those are the sell-orders we ar buying from.
          if(buyEntries && buyEntries.length > 0){
            prices.singleBuyPrice = buyEntries[0].price;
            prices.buyPriceX = prices.singleBuyPrice * count;
          }

          if(sellEntries && sellEntries.length > 0) {

            prices.singleSellPrice = sellEntries[0].price
            const sellPriceForX = prices.singleSellPrice * count;
            prices.sellPriceX = sellPriceForX;

            const brokerFee =  sellPriceForX / 100 * 2.5;
            prices.brokerFee = brokerFee;

            const saleTax = sellPriceForX / 100 * saleTaxPercent;
            prices.saleTax = saleTax;

            prices.nettoSalePrice = (sellPriceForX - brokerFee) - saleTax;

            prices.shippingCost = CalculateShippingCost(prices.singleBuyPrice, itemDetails.packaged_volume, count);
            prices.profit = (prices.nettoSalePrice - prices.buyPriceX) - prices.shippingCost;

          }
            return prices;
        }));
  }

  public IsOnShoppingList(type_id: number): boolean {
    return this.shopphingListService.ContainsItem(type_id);
  }

  public addOrRemoveShoppingList(sell: SellPrice) {
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
  }
}