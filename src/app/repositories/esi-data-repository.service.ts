import { HttpClient } from '@angular/common/http';
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

  public getImageForType(typeId: number) {
    const url = `https://imageserver.eveonline.com/Type/${typeId}_128.png`
   return this.getRequest<string>(url);
  }

  private getRequest<T>(url: string ): Observable<T> {
    return this.httpClient.get<T>(url).pipe(shareReplay(1));
  }

  private postRequest<T>(url: string, body: any): Observable<T> {
    return this.httpClient.post<T>(url, body);
  }
}
