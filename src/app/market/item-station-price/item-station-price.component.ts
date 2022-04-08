import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, Observable, switchMap, tap } from 'rxjs';
import { MarketEntry } from 'src/app/models';
import { ItemIdentifier, MarketService } from 'src/app/shared';

@Component({
  selector: 'eve-item-station-price',
  templateUrl: './item-station-price.component.html',
  styleUrls: ['./item-station-price.component.scss']
})
export class ItemStationPriceComponent implements OnInit {
  // @Input()
  // public itemIdentifier: ItemIdentifier | null;
  // @Input()
  // public stationId : number = 1038457641673;

  @Input()
  public sellStation$ : Observable<number>; //1038457641673
  @Input()
  public itemIdentifier$: Observable<ItemIdentifier>;
  
  public marketData$: Observable<MarketEntry[]>;

  constructor(private marketService: MarketService) {

   }

  ngOnInit(): void {

    if(this.sellStation$ && this.itemIdentifier$) {
      this.marketData$ = combineLatest([this.sellStation$, this.itemIdentifier$]).pipe(
        switchMap(([sellStation, itemIdentifier]) =>  {
          console.log("marketData$ triggered")
          return this.marketService.getStructureMarketForItem(sellStation, itemIdentifier.id, false)
          .pipe(tap(e => console.log("getStructureMarketForItem")))
        }
          ));
     
    }
  }

}
