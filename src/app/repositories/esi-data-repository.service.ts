import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SearchResult } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EsiDataRepositoryService {

  constructor(
    private httpClient: HttpClient) { }

  public findItemByName(searchName: string) : Observable<SearchResult> {
    const url = environment.esiBaseUrl + '/v1/universe/ids/';

    return this.httpClient.post<SearchResult>(url, `["${searchName}"]`);
  }
}
