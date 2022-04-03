import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {

  constructor(private http: HttpClient) { }

  public getServerStatus(): Observable<string> {
    const url = environment.esiBaseUrl + '/status/';
    return this.http.get<string>(url)
}

}
