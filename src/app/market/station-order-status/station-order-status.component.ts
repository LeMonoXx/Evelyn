import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, filter, forkJoin, map, mergeMap, Observable, of, switchMap } from 'rxjs';
import { ItemDetails, MarketEntry, MarketOrder, StructureDetails } from 'src/app/models';
import { EsiDataRepositoryService } from 'src/app/repositories';
import { CharacterService, MarketService, UniverseService } from 'src/app/shared';

@Component({
  selector: 'app-station-order-status',
  templateUrl: './station-order-status.component.html',
  styleUrls: ['./station-order-status.component.scss']
})
export class StationOrderStatusComponent implements OnInit {

  @Input()
  public structure$ : Observable<StructureDetails>;
  
  public charMarketOrdersObs: Observable<{ marketOrder: MarketOrder, itemDetails: ItemDetails, marketEntry: MarketEntry }[]>;

  constructor(private marketService: MarketService,
    private characterService: CharacterService,
    private esiDataService: EsiDataRepositoryService,
    private universeService: UniverseService) { }

  ngOnInit(): void {

    const characterObs = this.characterService.getAuthenticatedCharacterInfo();

    this.charMarketOrdersObs = combineLatest([characterObs, this.structure$]).pipe(
      mergeMap(([character, structure]) => 
        this.marketService.getMarketOrders(structure.evelyn_structureId, character.CharacterID, false).pipe(
          map(orders => {
            const requests: Observable<{ marketOrder: MarketOrder, itemDetails: ItemDetails, marketEntry: MarketEntry }>[] = [];
            orders.forEach(order => {
              const itemDetailsObs = this.universeService.getItemDetails(order.type_id).pipe(
                              map(details => ({ marketOrder: order, itemDetails: details, marketEntry: null })));

              const itemMarketDataObs = itemDetailsObs.pipe(
                          switchMap(order_item => this.marketService
                                 .getStructureMarketForItem(order.location_id, order.type_id, false).pipe(
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
          mergeMap(array => forkJoin(array)),
          map(entries => entries.sort((a, b) => 
          a.marketOrder.price - b.marketOrder.price ||
          a.itemDetails.type_id - b.itemDetails.type_id))
        )
      ));
  }

  public getImageForItem(typeId: number): string {
    return this.esiDataService.getImageUrlForType(typeId, 32);
  }

}
