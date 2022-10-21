import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { EsiHeaders } from './esi-headers';

@Injectable({
  providedIn: 'root'
})
export class EsiDataRepositoryService {

  private options = { 
    headers: {'Accept-Language': 'en-US'}
  };

  constructor(
    private httpClient: HttpClient
  ) { }

  public getRequest<T>(url: string): Observable<T> {

    return this.httpClient.get<T>(url, this.options).pipe(shareReplay(1));
  }

  public getText(url: string): Observable<string> {
    return this.httpClient.get(url, {responseType: 'text'})
  }

  public getPagingRequest<T>(url: string): Observable<Array<T>> {
    const result = this.httpClient.get<Array<T>>(url, {observe: 'response'}).pipe(
      map(response => {
        let totalPages = 1;
        let resultSet: Observable<Array<T>>[] = [];

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
              const newRequest = this.httpClient.get<Array<T>>( url + `?page=${curPage}`, this.options)
                                  .pipe(shareReplay(1));
              result.resultSet.push(newRequest);
            }
        return result.resultSet;
      }),
      switchMap(a => forkJoin(a)),
      map(fork => fork.reduce((result, arr) => [...result, ...arr], [])),
      shareReplay(1)
    );

    return result;
  }

  public postRequest(url: string, body: any): Observable<any> {
    return this.httpClient.post(url, body);
  }
}
