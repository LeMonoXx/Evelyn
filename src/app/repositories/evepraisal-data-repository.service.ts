import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EvePraisalSearchResult } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EvepraisalDataRepositoryService {

  constructor(private httpClient: HttpClient) { }

  public getAutoCompleteSuggestions(searchName: string) {
    const url = environment.evepraisalBaseUrl + `search.json?q=${searchName}`;
    return this.httpClient.get<EvePraisalSearchResult[]>(url).pipe(shareReplay(1));
  }
}
