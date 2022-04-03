import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {

  // Sourly Kashada: 92648793
  constructor(private http: HttpClient) { }

  public getServerStatus(): Observable<any> {
    const url = environment.esiBaseUrl + '/status/';
    return this.http.get<any>(url)
}

public getCharacterInformation(characterId: number = 92648793): Observable<any> {
  const url = environment.esiBaseUrl + `/characters/${characterId}/`;
  return this.http.get<any>(url)
}

public getAuthenticatedCharacterInfo() : Observable<any> {
  return this.http.get<any>(environment.esiVerifyUrl)
}

}
