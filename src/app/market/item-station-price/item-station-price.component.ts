import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { combineLatest, map, mergeMap, Observable, switchMap } from 'rxjs';
import { ItemDetails, MarketEntry, StationDetails, StructureDetails } from 'src/app/models';
import { EsiDataRepositoryService } from 'src/app/repositories/esi-data-repository.service';
import { CalculateShippingCost, ItemIdentifier, MarketService, SellPrice } from 'src/app/shared';

@Component({
  selector: 'eve-item-station-price',
  templateUrl: './item-station-price.component.html',
  styleUrls: ['./item-station-price.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItemStationPriceComponent implements OnInit {

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
    private esiDataService: EsiDataRepositoryService) {

   }

  ngOnInit(): void {
    this.currentItemImageSourceObs = this.itemIdentifier$.pipe(
      map(item => {
        return this.esiDataService.getImageUrlForType(item.id, 64);
      }));

      this.itemBuyCostObs = this.itemIdentifier$.pipe(
        switchMap(item => this.marketService.getRegionMarketForItem(item.id))
        );
        

      this.itemSellCostObs$ = combineLatest([this.sellStation$, this.itemIdentifier$]).pipe(
        mergeMap(([sellStation, itemIdentifier]) =>  
          this.marketService.getStructureMarketForItem(sellStation.evelyn_structureId, itemIdentifier.id, false)
        ));

        this.calculatedSellData$ = combineLatest([this.numberCount$, this.itemBuyCostObs, this.itemDetails$, this.itemSellCostObs$]).pipe(
          map(([count, buyEntries, itemDetails, sellEntries]) => {
          const prices: SellPrice = {
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

            const saleTax = sellPriceForX / 100 * 3.6;
            prices.saleTax = saleTax;

            prices.nettoSalePrice = (sellPriceForX - brokerFee) - saleTax;

            prices.shippingCost = CalculateShippingCost(prices.singleBuyPrice, itemDetails.packaged_volume, count);
            prices.profit = (prices.nettoSalePrice - prices.buyPriceX) - prices.shippingCost;

          }
            return prices;
        }));
  }
}
