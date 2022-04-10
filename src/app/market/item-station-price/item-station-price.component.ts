import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { combineLatest, concat, forkJoin, map, mergeMap, Observable, startWith, switchMap, tap, zip } from 'rxjs';
import { MarketEntry } from 'src/app/models';
import { ItemIdentifier, MarketService, SellPrice } from 'src/app/shared';

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
  public sellStation$ : Observable<number>; //1038457641673
  @Input()
  public itemIdentifier$: Observable<ItemIdentifier>;
  
  public marketData$: Observable<MarketEntry[]>;
  public calculatedSellData$: Observable<SellPrice>;

  constructor(private marketService: MarketService) {

   }

  ngOnInit(): void {
      this.marketData$ = combineLatest([this.sellStation$, this.itemIdentifier$]).pipe(
        mergeMap(([sellStation, itemIdentifier]) =>  
          this.marketService.getStructureMarketForItem(sellStation, itemIdentifier.id, false)
        ));

        this.calculatedSellData$ = combineLatest([this.numberCount$, this.marketData$]).pipe(
          map(([count, entries]) => {
          console.log("calculatedSellData map");

          const prices: SellPrice = { 
            grossSellPrice: 0,
            brokerFee: 0,
            saleTax: 0,
            nettoSalePrice: 0,
            profit: 0,
            shippingCost: 0,
            afterShippingProfit: 0,
          };

          if(entries && entries.length > 0) {
            const sellPrice = entries[0].price * count;
            const brokerFee =  sellPrice / 100 * 2.5;
            const saleTax = sellPrice / 100 * 3.6;
   
            prices.grossSellPrice = sellPrice;
            prices.brokerFee = brokerFee;
            prices.saleTax = saleTax;
            prices.nettoSalePrice = (sellPrice - brokerFee) - saleTax;
            prices.profit = 0;
            prices.shippingCost = 0;
            prices.afterShippingProfit = 0;

          }
            return prices;
        }));
  }

}
