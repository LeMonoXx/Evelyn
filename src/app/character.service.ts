import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ServerStatus, Character, AuthenticatedCharacter, Portrait } from './models/index';
import { EsiDataRepositoryService } from './repositories/esi-data-repository.service';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {

  // Sourly Kashada: 92648793
  constructor(private http: HttpClient, 
    private esiDataService: EsiDataRepositoryService) { }

  public getServerStatus(): Observable<ServerStatus> {
    const url = environment.esiBaseUrl + '/status/';
    return this.http.get<ServerStatus>(url)
}

public getCharacterInformation(characterId: number): Observable<Character> {
  const url = environment.esiBaseUrl + `/characters/${characterId}/`;
  return this.http.get<Character>(url)
}

public getAuthenticatedCharacterInfo() : Observable<AuthenticatedCharacter> {
  return this.http.get<AuthenticatedCharacter>(environment.esiVerifyUrl)
}

public getCharacterImage(characterId: number): Observable<Portrait> {
  const url = environment.esiBaseUrl + `/characters/${characterId}/portrait/`;
  return this.http.get<Portrait>(url)
}
}
