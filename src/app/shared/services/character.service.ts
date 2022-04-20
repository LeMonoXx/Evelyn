import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServerStatus, Character, AuthenticatedCharacter, Portrait, CharacterSkills } from 'src/app/models';
import { EsiDataRepositoryService } from 'src/app/repositories';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {

  // Sourly Kashada: 92648793
  constructor(private esiDataService: EsiDataRepositoryService) { }

  public getServerStatus(): Observable<ServerStatus> {
      const url = environment.esiBaseUrl + '/status/';
      return this.esiDataService.getRequest<ServerStatus>(url)
  }

  public getCharacterInformation(characterId: number): Observable<Character> {
    const url = environment.esiBaseUrl + `/characters/${characterId}/`;
    return this.esiDataService.getRequest<Character>(url)
  }

  public getAuthenticatedCharacterInfo() : Observable<AuthenticatedCharacter> {
    return this.esiDataService.getRequest<AuthenticatedCharacter>(environment.esiVerifyUrl)
  }

  public getCharacterImage(characterId: number): Observable<Portrait> {
    const url = environment.esiBaseUrl + `/characters/${characterId}/portrait/`;
    return this.esiDataService.getRequest<Portrait>(url)
  }

  public getCharacterSkills(characterId: number): Observable<CharacterSkills> {
      const url = environment.esiBaseUrl + `/characters/${characterId}/skills/`;
    return this.esiDataService.getRequest<CharacterSkills>(url)
  }
}
