import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { concatAll, concatMap, flatMap, forkJoin, map, merge, mergeAll, mergeMap, Observable, of, shareReplay, switchMap, toArray, zip } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MarketEntry, SearchResult } from '../models';
import { EsiHeaders } from './esi-headers';

@Injectable({
  providedIn: 'root'
})
export class EsiDataRepositoryService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  public findItemByName(searchName: string) : Observable<SearchResult> {
    const url = environment.esiBaseUrl + '/latest/universe/ids/';

    return this.postRequest(url, `["${searchName}"]`);
  }

  public getImageUrlForType(typeId: number, size: number = 64) : string {
    const url = `https://imageserver.eveonline.com/Type/${typeId}_${size}.png`
    return url;
  }

  public getRequest<T>(url: string, headers? : HttpHeaders): Observable<T> {
    const options = { 
      headers: headers, 
    };

    return this.httpClient.get<T>(url, options).pipe(shareReplay(1));
  }

  public getPagingRequest(url: string, headers? : HttpHeaders): Observable<MarketEntry[]> {
    const options = { 
      headers: headers
    };

    const result = this.httpClient.get<MarketEntry[]>(url, {observe: 'response'}).pipe(
      map(response => {
        let totalPages = 1;
        let resultSet: Observable<MarketEntry[]>[] = [];

        if(response.body) {
          resultSet.push(of(response.body));
        }
 
        if(response.headers.has(EsiHeaders.ESI_PAGING_HEADER_NAME)) {
          totalPages = Number(response.headers.get(EsiHeaders.ESI_PAGING_HEADER_NAME))         
        }

        return { resultSet: resultSet, totalPages: totalPages };
      }), 
      map(result => {
        let curPage = 1;
        while(curPage < result.totalPages) {
              // we start with page=1. so we count up directly
              curPage++;
              const newRequest = this.httpClient.get<MarketEntry[]>( url + `?page=${curPage}`, options);
              result.resultSet.push(newRequest);
            }
        return result.resultSet;
      }),
      switchMap(a => forkJoin(a)),
      map(fork => fork.reduce((result, arr) => [...result, ...arr], []))
    );
    return result;
  }

  private postRequest<T>(url: string, body: any): Observable<T> {
    return this.httpClient.post<T>(url, body);
  }
}
