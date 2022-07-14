import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, debounceTime, defaultIfEmpty, forkJoin, map, mergeMap, Observable, switchMap, tap } from 'rxjs';
import { ItemDetails, MarketEntry, MarketOrder } from 'src/app/models';
import { CharacterService, copyToClipboard, GeneralStation, MarketService, UniverseService } from 'src/app/shared';

@Component({
  selector: 'app-station-order-status',
  templateUrl: './station-order-status.component.html',
  styleUrls: ['./station-order-status.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StationOrderStatusComponent implements OnInit {

  @Input()
  public station$ : Observable<GeneralStation>;
  
  public charMarketOrdersObs: Observable<{ marketOrder?: MarketOrder, itemDetails?: ItemDetails, marketEntry?: MarketEntry }[] | null>;

  constructor(private marketService: MarketService,
    private characterService: CharacterService,
    private universeService: UniverseService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {

    const characterObs = this.characterService.getAuthenticatedCharacterInfo();
    this.charMarketOrdersObs = combineLatest([characterObs, this.station$]).pipe(   
      debounceTime(500),
      mergeMap(([character, station]) => 
        this.marketService.getMarketOrders(station.station_Id, character.CharacterID, false).pipe(
          map(orders => {
            const requests: Observable<{ marketOrder: MarketOrder, itemDetails: ItemDetails, marketEntry: MarketEntry }>[] = [];
            orders.forEach(order => {
              const itemDetailsObs = this.universeService.getItemDetails(order.type_id).pipe(
                              map(details => ({ marketOrder: order, itemDetails: details, marketEntry: null })));
              const itemMarketDataObs = itemDetailsObs.
                          pipe(
                          tap(_ => console.log("start station-order-status getStructureMarketForItem")),
                          switchMap(order_item => this.marketService
                                 .getMarketEntries(order.type_id, station, false).pipe(
                                  map(items => (
                                      { 
                                        marketOrder: order_item.marketOrder,
                                        itemDetails: order_item.itemDetails,
                                        marketEntry: items[0]
                                      }
                                      )))
                                  ))
              requests.push(itemMarketDataObs);
            } )
            return requests;
          }),
          mergeMap(array => forkJoin(array).pipe(
            defaultIfEmpty(null))
            ),
          map(entries => {
            if(entries) {
              entries.sort((a, b) => 
              a.marketOrder.price > b.marketOrder.price ? -1 : 1 ||
              a.itemDetails.type_id - b.itemDetails.type_id)
              return entries;
            }
            return null;
          })))
      );
  }

  public getImageForItem(typeId: number): string {
    return this.universeService.getImageUrlForType(typeId, 32);
  }

  public copy(text: string) {
    copyToClipboard(text);
    
    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
}
