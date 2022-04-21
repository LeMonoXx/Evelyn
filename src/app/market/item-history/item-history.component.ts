import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { combineLatest, debounceTime, Observable, switchMap, tap } from 'rxjs';
import { MarketHistory } from 'src/app/models';
import { ItemIdentifier, MarketService } from 'src/app/shared';

@Component({
  selector: 'app-item-history',
  templateUrl: './item-history.component.html',
  styleUrls: ['./item-history.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItemHistoryComponent implements OnInit {
  public border: Object;
  public chartArea: Object = {
    border: { width : 0}
  };

  public primaryXAxis = {
    valueType: 'DateTime',
    title: 'Sales Across Years',
    labelFormat: 'yMMM'
  };
  
  public primaryYAxis = {
    title: 'Sales Amount in millions(USD)'
  };

  public margin = { left: 0, right: 0, top: 0, bottom: 0 };

  @Input()
  public itemIdentifier$: Observable<ItemIdentifier>;

  @Input()
  public region$: Observable<number>;

  public historyDataObs: Observable<MarketHistory[]>;

  constructor(
    private marketService: MarketService
  ) { }

  ngOnInit(): void {
    this.border = { width: 0 };
    

    this.historyDataObs = combineLatest([this.itemIdentifier$, this.region$]).pipe(
      debounceTime(250),
      tap(([item, region]) => console.log("historyDataObs started: ", this.itemIdentifier$, this.region$)),
      switchMap(([item, region]) => this.marketService.getHistoricalDataForItem(item.id, region)))
  }

}
