import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, debounceTime, map, Observable, switchMap, tap } from 'rxjs';
import { MarketHistory } from 'src/app/models';
import { ItemIdentifier, MarketService } from 'src/app/shared';

@Component({
  selector: 'app-item-history',
  templateUrl: './item-history.component.html',
  styleUrls: ['./item-history.component.scss']
})
export class ItemHistoryComponent implements OnInit {

  @Input()
  public itemIdentifier$: Observable<ItemIdentifier>;

  @Input()
  public region$: Observable<number>;

  public historyDataObs: Observable<MarketHistory[]>;

  constructor(
    private marketService: MarketService
  ) { }

  ngOnInit(): void {

    this.historyDataObs = combineLatest([this.itemIdentifier$, this.region$]).pipe(
      debounceTime(250),
      tap(([item, region]) => console.log("historyDataObs started: ", this.itemIdentifier$, this.region$)),
      switchMap(([item, region]) => this.marketService.getHistoricalDataForItem(item.id, region)))
  }

}
