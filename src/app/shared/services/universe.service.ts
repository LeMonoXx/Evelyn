import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { ItemDetails, SearchResult, EveItem, ItemGroup, StructureDetails, StationDetails, Constellation, Region, System } from 'src/app/models';
import { ItemCategory } from 'src/app/models/universe/categories/item-category';
import { EsiDataRepositoryService } from 'src/app/repositories/esi-data-repository.service';
import { environment } from 'src/environments/environment';
import { parse } from 'yaml';
import { getStoredEveTypes, storeEveTypes } from '../functions/storage';
import { GeneralStation } from '../models/structure/general-station';

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

  public getStation(station_id: number, isStructure: boolean) : Observable<GeneralStation> {

    let stationObs: Observable<GeneralStation>;
    if(isStructure)
      stationObs = this.getStructureDetails(station_id);
    else
      stationObs = this.getStationDetails(station_id);

    return stationObs.pipe(
      switchMap(station => this.getSystem(station.solar_system_id).pipe(
        switchMap(system => this.getConstellation(system.constellation_id).pipe(
          map(constellation => {
            station.region_id = constellation.region_id;
            return station;
          })))
      )));
  }

  public getStructureDetails(structureId: number) : Observable<GeneralStation> {
    const url = environment.esiBaseUrl + `/universe/structures/${structureId}/`
    return this.esiDataService.getRequest<StructureDetails>(url).pipe(
      map(structure => {
        return ({
          station_Id: structureId,
          name: structure.name,
          solar_system_id: structure.solar_system_id,
          type_id: structure.type_id,
          isStructure: true
        } as GeneralStation);
      })
    )
  }

  public getStationDetails(stationId: number) : Observable<GeneralStation> {
    const url = environment.esiBaseUrl + `/universe/stations/${stationId}/`
    return this.esiDataService.getRequest<StationDetails>(url).pipe(
      map(details => ({
        station_Id: details.station_id,
        name: details.name,
        solar_system_id: details.system_id,
        type_id: details.type_id,
        isStructure: false
      } as GeneralStation))
    );
  }

  public getSystem(system_id: number) : Observable<System> {
    const url = environment.esiBaseUrl + `/universe/systems/${system_id}/`
    return this.esiDataService.getRequest<System>(url);
  }

  public getConstellation(constellation_id: number) : Observable<Constellation> {
    const url = environment.esiBaseUrl + `/universe/constellations/${constellation_id}/`
    return this.esiDataService.getRequest<Constellation>(url);
  }

  public getRegion(region_id: number) : Observable<Region> {
    const url = environment.esiBaseUrl + `/universe/regions/${region_id}/`
    return this.esiDataService.getRequest<Region>(url);
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
