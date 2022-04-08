import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, Observable, shareReplay, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SearchResult } from '../models';
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

  public getPagingRequest<T>(url: string, headers? : HttpHeaders): Observable<T> {
    const options = { 
      headers: headers
    };

    const result = this.httpClient.get<T>(url, {observe: 'response'}).pipe(
      switchMap(async response => {
        let totalPages = 1;
        let finalResult : T[] = [];

        if(response.body) {
          finalResult.push(response.body);
        }
 
        if(response.headers.has(EsiHeaders.ESI_PAGING_HEADER_NAME)){
          totalPages = Number(response.headers.get(EsiHeaders.ESI_PAGING_HEADER_NAME))         
          
          let curPage = 1;
          while(curPage < totalPages) {
            // we start with page=1. so we count up directly
            curPage++;
            await this.httpClient.get<T>( url + `?page=${curPage}`, options)
            .pipe(map(newPageValues => finalResult.push(newPageValues))).toPromise();

            console.log('finalResult length is: ' + finalResult.length)

          }
        }
        return finalResult;
      }),
      mergeMap(r => r),
      shareReplay(1));
    return result;
  }

  private postRequest<T>(url: string, body: any): Observable<T> {
    return this.httpClient.post<T>(url, body);
  }
}
