import { Injectable } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
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
    const url = environment.esiBaseUrl + `/markets/structures/${structureId}/datasource=tranquility&page=${page}`
    return this.esiDataService.getRequest<MarketEntry[]>(url);
  }

  public getStructureMarketForItem(structureId: number, itemId: number, isBuyOrder: boolean): Observable<MarketEntry[]> {
      return this.getStructureMarketEntries(structureId).pipe(
        map(entries => 
          entries.filter(e => e.type_id == itemId && e.is_buy_order == isBuyOrder)
                .sort(e => e.price)
          )
      );
  }
}
