import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, map, mergeMap, Observable, switchMap, tap } from 'rxjs';
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
  public lowestSell$: Observable<MarketEntry>;

  constructor(private marketService: MarketService) {

   }

  ngOnInit(): void {

    if(this.sellStation$ && this.itemIdentifier$) {
      this.marketData$ = combineLatest([this.sellStation$, this.itemIdentifier$]).pipe(
        mergeMap(([sellStation, itemIdentifier]) =>  
          this.marketService.getStructureMarketForItem(sellStation, itemIdentifier.id, false)
        ));

        this.lowestSell$ = this.marketData$.pipe(map(entries => entries[0]));
    }
  }

}
