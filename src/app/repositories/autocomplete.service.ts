import { Injectable } from '@angular/core';
import { EveItem } from '../models';
import { distinctUntilChanged, map, Observable, shareReplay } from 'rxjs'
import { EsiDataRepositoryService } from './esi-data-repository.service';

@Injectable({
  providedIn: 'root'
})
export class AutocompleteService {

  constructor(private esiDataService: EsiDataRepositoryService) { }

  public getAutoCompleteSuggestions(searchName: string): Observable<EveItem[]> {
    return this.getGetAllItems().pipe(
      map(a => a.filter(i => i.name?.includes(searchName))),
      map(items => {

        // sort items with the hamming distance algorithm
        items.forEach(item => {
          let dist_counter = 0;
          if(item.name) {
            for(let i = 0; i < item.name?.length; i++) {
              const curLetter = item.name[i];

              if(searchName.length < i) {
                dist_counter += 1;
                continue;
              }

              if(curLetter != searchName[i])
                dist_counter += 1;
            }
          } else {
            dist_counter = 999;
          }

          item.order = dist_counter;
        })

        return items.sort((a, b) => a.order - b.order);
      }),
      shareReplay(1),
      distinctUntilChanged()
    )
  }

  public getExactItemMatch(searchName: string): Observable<EveItem> {
    return this.getGetAllItems().pipe(
      map(a => a.find(i => (i.name?.length === searchName.length) && (i.name?.includes(searchName)))),
      map(i => {
        if(i)
        return i;

        return ({ typeId: 0, name: "", order: 0 })
      }),
      shareReplay(1),
      distinctUntilChanged()
    );
  }

  public getGetAllItems() : Observable<EveItem[]> {
    const url = "assets/typeIDs.json"
    return this.esiDataService.getRequest<EveItem[]>(url).pipe(
      // add all eve-types to the storage for later usage
      distinctUntilChanged()
    );
  }
}
