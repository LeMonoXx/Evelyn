import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { AuthService } from '../auth.service';
import { EsiHeaders } from './esi-headers';

@Injectable({
  providedIn: 'root'
})
export class EsiDataRepositoryService {

  constructor(
    private httpClient: HttpClient,
    private authService: AuthService
  ) { }

  public getImageUrlForType(typeId: number, size: number = 64) : string {
    const url = `https://imageserver.eveonline.com/Type/${typeId}_${size}.png`
    return url;
  }

  public getRequest<T>(url: string, headers? : HttpHeaders): Observable<T> {
    const options = { 
      headers: headers, 
    };
    return this.authService.HasValidAuthenticationObs.pipe(
      switchMap(access =>
      this.httpClient.get<T>(url, options).pipe(shareReplay(1))
    ))

    // return this.httpClient.get<T>(url, options).pipe(shareReplay(1));
  }

  public getPagingRequest<T>(url: string, headers? : HttpHeaders): Observable<Array<T>> {
    const options = { 
      headers: headers
    };

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
              const newRequest = this.httpClient.get<Array<T>>( url + `?page=${curPage}`, options);
              result.resultSet.push(newRequest);
            }
        return result.resultSet;
      }),
      switchMap(a => forkJoin(a)),
      map(fork => fork.reduce((result, arr) => [...result, ...arr], []))
    );


    return this.authService.HasValidAuthenticationObs.pipe(
      switchMap(access =>
        result
    ))

    // return result;
  }

  public postRequest<T>(url: string, body: any): Observable<T> {
    return this.httpClient.post<T>(url, body);
  }
}
