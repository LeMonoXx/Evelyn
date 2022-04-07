import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MarketerSearchResult } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EveMarketerDataRepositoryService {

  constructor(private httpClient: HttpClient) { }

  public findItemByName(searchName: string) : Observable<MarketerSearchResult> {
    const url = environment.eveMarketerBaseUrl + `/types/search?q=${searchName}&language=en`;

    return this.httpClient.get<MarketerSearchResult[]>(url)
            .pipe(map(r => r[0]), shareReplay(1));
  }

  public getAutoCompleteSuggestions(searchName: string) {
    const url = environment.eveMarketerBaseUrl + `/types/autocomplete?q=${searchName}&language=en`;
    return this.httpClient.get<MarketerSearchResult[]>(url).pipe(shareReplay(1));
  }
}
