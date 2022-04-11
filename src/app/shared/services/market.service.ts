import { Injectable } from '@angular/core';
import { filter, map, merge, mergeMap, Observable, tap } from 'rxjs';
import { MarketEntry } from 'src/app/models';
import { EsiDataRepositoryService } from 'src/app/repositories/esi-data-repository.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  constructor(private esiDataService: EsiDataRepositoryService) { }

  
  public getStructureMarketEntries(structureId: number) : Observable<MarketEntry[]> {
    const page = 1;
    const url = environment.esiBaseUrl + `/markets/structures/${structureId}/`
    return this.esiDataService.getPagingRequest<MarketEntry>(url);
  }

  public getStructureMarketForItem(structureId: number, itemId: number, isBuyOrder: boolean): Observable<MarketEntry[]> {
      return this.getStructureMarketEntries(structureId).pipe(
        map(entries => {
          console.log("entries length: " + entries.length);
          return entries.filter(e => e.type_id == itemId && e.is_buy_order == isBuyOrder)
                        .sort((a, b) => a.price - b.price)
        })
      );
  }

  public getRegionMarketForItem(itemId: number, regionId: number = 10000002, orderType: string = "sell"): Observable<MarketEntry[]> {
    // We do not need to load pages of the resultm becuase we filter for a type_id, and the service response in a single page
    const url = environment.esiBaseUrl + `/markets/${regionId}/orders/?order_type=${orderType}&page=1&type_id=${itemId}`

    return this.esiDataService.getRequest<MarketEntry[]>(url).pipe(
      map(entries => {
        console.log("getRegionMarketForItem entries length: " + entries.length);
        return entries.sort((a, b) => a.price - b.price)
        //.filter(e => e.location_id == 60003760)
      }));
  }
}
