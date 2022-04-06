import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EsiDataRepositoryService {

  constructor(private httpClient: HttpClient) { }

  public findItemByName(searchName: string) : any {
    return undefined;
  }
}
