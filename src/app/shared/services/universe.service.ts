import { Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { ItemDetails, SearchResult, StationDetails, StructureDetails as StructureDetails, EveItem } from 'src/app/models';
import { EsiDataRepositoryService } from 'src/app/repositories/esi-data-repository.service';
import { environment } from 'src/environments/environment';
import { parse } from 'yaml';
import { getStoredBlueprintDetails, getStoredEveTypes, storeEveTypes } from '../functions/storage';

@Injectable({
  providedIn: 'root'
})
export class UniverseService {

  constructor(private esiDataService: EsiDataRepositoryService) { }

  public getImageUrlForType(typeId: number, size: number = 64) : string {
    const url = `https://imageserver.eveonline.com/Type/${typeId}_${size}.png`
    return url;
  }

  public getItemDetails(typeId: number) : Observable<ItemDetails> {
    const url = environment.esiBaseUrl + `/universe/types/${typeId}/`
    return this.esiDataService.getRequest<ItemDetails>(url)
  }

  public getStructureDetails(structureId: number) : Observable<StructureDetails> {
    const url = environment.esiBaseUrl + `/universe/structures/${structureId}/`
    return this.esiDataService.getRequest<StructureDetails>(url).pipe(
      map(structure => {

        if(structure)
          structure.evelyn_structureId = structureId;

        return structure;
      })
    )
  }
  public getStationDetails(stationId: number) : Observable<StationDetails> {
    const url = environment.esiBaseUrl + `/universe/stations/${stationId}/`
    return this.esiDataService.getRequest<StationDetails>(url);
  } 

  public findItemByName(searchName: string) : Observable<SearchResult> {
    const url = environment.esiBaseUrl + `/search/?categories=inventory_type&language=en&search=${searchName}&strict=true`;
    return this.esiDataService.getRequest<SearchResult>(url);
  }

  public getGetAllItems() : Observable<EveItem[]> {

    const storedDetails = getStoredEveTypes(); 

    if(storedDetails) {
      return of(Object.values(storedDetails));
    }

    const url = environment.sdeBaseUrl + `/fsd/typeIDs.yaml`
    return this.esiDataService.getText(url).pipe(
      map(text => parse(text) as { [typeId: number]: EveItem }),
      // add all blueprint-details to the storage for later usage
      tap(types => storeEveTypes(types)),
      map(types => Object.values(types))
    );
  }
}
