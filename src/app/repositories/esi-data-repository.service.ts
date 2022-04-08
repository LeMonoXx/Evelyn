import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SearchResult } from '../models';

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

  private getRequest<T>(url: string, headers? : HttpHeaders): Observable<T> {
    const options = { 
      headers: headers, 
    };

    return this.httpClient.get<T>(url, options).pipe(shareReplay(1));
  }

  private postRequest<T>(url: string, body: any): Observable<T> {
    return this.httpClient.post<T>(url, body);
  }
}
