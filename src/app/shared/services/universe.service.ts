import { Injectable } from '@angular/core';
import { catchError, filter, map, Observable, of, tap } from 'rxjs';
import { ItemDetails, SearchResult, StationDetails, StructureDetails as StructureDetails, EveItem, ItemGroup } from 'src/app/models';
import { ItemCategory } from 'src/app/models/universe/categories/item-category';
import { EsiDataRepositoryService } from 'src/app/repositories/esi-data-repository.service';
import { environment } from 'src/environments/environment';
import { parse } from 'yaml';
import { getStoredEveTypes, storeEveTypes } from '../functions/storage';

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

  // public findItemByName(searchName: string) : Observable<SearchResult> {
  //   const url = environment.esiBaseUrl + `/search/?categories=inventory_type&language=en&search=${searchName}&strict=true`;
  //   return this.esiDataService.getRequest<SearchResult>(url).pipe(
  //     map(r => {
  //       if (r && r.inventory_type) {
  //         return r;
  //       }
  //       return ({ inventory_type: [0] });
  //     }),
  //     catchError(err => {
  //     return of({
  //       inventory_type: [0]
  //   })
  //   }));
  // }  
  
  public findItemByName(searchName: string) : Observable<SearchResult> {
    const url = `https://www.fuzzwork.co.uk/api/typeid2.php?typename=${searchName}`;
    return this.esiDataService.getRequest<([{typeID: number, typeName: string}])>(url).pipe(
      map(r => {
        return ({ inventory_type: [r[0].typeID] });
      }),
      catchError(err => {
      return of({
        inventory_type: [0]
    })
    }));
  }

  public getAllGroups(): Observable<number[]> {
    const url = environment.esiBaseUrl + `/universe/groups/`;
    return this.esiDataService.getPagingRequest<number>(url);
  }

  public getItemGroup(groupId: number): Observable<ItemGroup> {
    const url = environment.esiBaseUrl + `/universe/groups/${groupId}`;
    return this.esiDataService.getRequest<ItemGroup>(url);
  }

  public getAllCategories(): Observable<number[]> {
    const url = environment.esiBaseUrl + `/universe/categories/`;
    return this.esiDataService.getRequest<number[]>(url);
  }

  public getItemCategory(categoryId: number): Observable<ItemCategory> {
    const url = environment.esiBaseUrl + `/universe/categories/${categoryId}`;
    return this.esiDataService.getRequest<ItemCategory>(url);
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
