import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, debounceTime, map, mergeMap, Observable, switchMap, tap } from 'rxjs';
import { ItemDetails, MarketEntry, StationDetails, StructureDetails } from 'src/app/models';
import { CalculateShippingCost, copyToClipboard, FavoritesService, ItemIdentifier, 
  JITA_REGION_ID, MarketService, TradeCalculation, 
  ShoppingEntry, ShoppingListService, UniverseService, getPriceForN, ShippingService, ItemTradeFavorite, getTradeCalculation } from 'src/app/shared';

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
  @Input()
  public shippingService$: Observable<ShippingService>
  
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

      this.itemBuyCostObs = combineLatest([ this.buyStation$, this.itemIdentifier$]).pipe(
        switchMap(([station, item]) => this.marketService.getRegionMarketForItem(item.id, JITA_REGION_ID).pipe(
            // we get the market for the whole region. But we only want the buyStation.
            map(entries => entries.filter(entry => entry.location_id === station.station_id))
          ))
        );
        
      this.itemSellCostObs$ = combineLatest([this.sellStation$, this.itemIdentifier$]).pipe(
        mergeMap(([sellStation, itemIdentifier]) =>  
          this.marketService.getStructureMarketForItem(sellStation.evelyn_structureId, itemIdentifier.id, false)
        ));

        this.tradeData$ = 
        combineLatest(
          [
            this.buyStation$,
            this.sellStation$,
            this.numberCount$, 
            this.itemBuyCostObs, 
            this.itemDetails$, 
            this.itemSellCostObs$,
            this.saleTaxPercent$,
            this.shippingService$
          ]).pipe(
            debounceTime(80),
            map((
              [
                buyStation,
                sellStructure,
                count, 
                buyEntries, 
                itemDetails, 
                sellEntries,
                saleTaxPercent,
                shippingService
              ]) => getTradeCalculation(buyStation,
                sellStructure,
                count, 
                buyEntries, 
                itemDetails, 
                sellEntries,
                saleTaxPercent,
                shippingService)));
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

  public addOrRemoveFavorite(item: ItemIdentifier, buyStation: StationDetails, sellStructure: StructureDetails) {
    const existingEntry = this.favoriteService.GetEntryById(item.id);

    if(!existingEntry) {
      const fav: ItemTradeFavorite = {
        type_id: item.id,
        buy_station: buyStation.station_id,
        sell_structure: sellStructure.evelyn_structureId
      };

      this.favoriteService.AddFavoriteItem(fav);  
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