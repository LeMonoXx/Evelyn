import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, debounceTime, defaultIfEmpty, forkJoin, map, mergeMap, Observable, switchMap, take, tap } from 'rxjs';
import { Asset, ItemDetails } from 'src/app/models';
import { CharacterService, copyToClipboard, GeneralStation, ItemSearchService, MarketService, UniverseService } from 'src/app/shared';

@Component({
  selector: 'app-missing-item-list',
  templateUrl: './missing-item-list.component.html',
  styleUrls: ['./missing-item-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MissingItemListComponent implements OnInit {
  
  @Input()
  public station$ : Observable<GeneralStation>;

  public missingAssetsObs: Observable<{ asset: Asset; itemDetails: ItemDetails; }[] | null>;
  
  constructor(private marketService: MarketService,
    private searchService: ItemSearchService,
    private characterService: CharacterService,
    private universeService: UniverseService,
    private snackBar: MatSnackBar) { }
    
    // public charMarketOrdersObs: Observable<{ marketOrder?: MarketOrder, itemDetails?: ItemDetails, marketEntry?: MarketEntry }[] | null>;


    ngOnInit(): void {
      const characterObs = this.characterService.getAuthenticatedCharacterInfo();

      const characterStationAssetsObs = combineLatest([characterObs, this.station$]).pipe(
        switchMap(([character, station]) => this.characterService.getCharacterAssets(character.CharacterID).pipe(
          // is_singleton ==> assembled item like ships that has been unboxed
          map(asset => asset.filter(a => a.location_id === station.station_Id && !a.is_blueprint_copy && !a.is_singleton))
        ))
      );

      this.missingAssetsObs = combineLatest([characterObs, this.station$, characterStationAssetsObs]).pipe(   
        debounceTime(250),
        mergeMap(([character, station, characterStationAssets]) => this.marketService.getMarketOrders(station.station_Id, character.CharacterID, false).pipe(
          map(orders => characterStationAssets.filter(asset => orders.find(o => o.type_id === asset.type_id) === undefined)),
          map(assets => {
            const requests: Observable<{asset: Asset, itemDetails: ItemDetails }>[] = [];
            assets.forEach(asset => {
              const itemDetailsObs = this.universeService.getItemDetails(asset.type_id).pipe(
                map(details => ({ asset: asset, itemDetails: details })));
                requests.push(itemDetailsObs);
            });
            return requests;
          }),
          mergeMap(array => forkJoin(array).pipe(
              defaultIfEmpty(null))
            ),
        )));

      // this.charMarketOrdersObs = combineLatest([characterObs, this.station$, characterStationAssetsObs]).pipe(   
      //   debounceTime(250),
      //   mergeMap(([character, station, characterStationAssets]) => 
      //     this.marketService.getMarketOrders(station.station_Id, character.CharacterID, false).pipe(
      //       map(orders => {
      //         const requests: Observable<{ marketOrder: MarketOrder, itemDetails: ItemDetails, marketEntry: MarketEntry }>[] = [];
      //         orders.forEach(order => {
      //           const itemDetailsObs = this.universeService.getItemDetails(order.type_id).pipe(
      //                           map(details => ({ marketOrder: order, itemDetails: details, marketEntry: null })));
      //           const itemMarketDataObs = itemDetailsObs.
      //                       pipe(
      //                       switchMap(order_item => this.marketService
      //                              .getMarketEntries(order.type_id, station, false).pipe(
      //                               map(items => (
      //                                   { 
      //                                     marketOrder: order_item.marketOrder,
      //                                     itemDetails: order_item.itemDetails,
      //                                     marketEntry: items[0]
      //                                   }
      //                                   )))
      //                               ))
      //           requests.push(itemMarketDataObs);
      //         } )
      //         return requests;
      //       }),
      //       mergeMap(array => forkJoin(array).pipe(
      //         defaultIfEmpty(null))
      //         ),
      //       map(entries => {
      //         if(entries) {
      //           entries.sort((a, b) => 
      //           a.marketOrder.price > b.marketOrder.price ? -1 : 1 ||
      //           a.itemDetails.type_id - b.itemDetails.type_id)
      //           return entries;
      //         }
      //         return null;
      //       })))
      //   );
    }
  
    public getImageForItem(typeId: number): string {
      return this.universeService.getImageUrlForType(typeId, 32);
    }
  
    public copy(text: string) {
      copyToClipboard(text);
      
      this.snackBar.open("Copied!", undefined, { duration: 2000 });
    }
  
    public openMarketDetails(type_id: number) {
      this.marketService.openMarketDetails(type_id).pipe(take(1)).subscribe();
      this.searchService.setItemCount(1);
      this.searchService.setCurrentItem({ id: type_id });
    }
}
