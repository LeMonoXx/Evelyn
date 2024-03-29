import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { ServerStatus, Character, AuthenticatedCharacter, Portrait, CharacterSkillBook, Asset } from 'src/app/models';
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
    return this.esiDataService.getRequest<AuthenticatedCharacter>(environment.esiVerifyUrl).pipe(
      switchMap(char => this.getCharacterWallet(char.CharacterID).pipe(map(wallet => {
        // we add the wallet to the auth-character information
        char.Wallet = wallet;
        return char;
      })))
    );
  }

  public getCharacterImage(characterId: number): Observable<Portrait> {
    const url = environment.esiBaseUrl + `/characters/${characterId}/portrait/`;
    return this.esiDataService.getRequest<Portrait>(url)
  }

  public getCharacterSkills(characterId: number): Observable<CharacterSkillBook> {
      const url = environment.esiBaseUrl + `/characters/${characterId}/skills/`;
    return this.esiDataService.getRequest<CharacterSkillBook>(url)
  }

  public getCharacterAssets(characterId: number): Observable<Asset[]> {
    const url = environment.esiBaseUrl + `/characters/${characterId}/assets/`;
    return this.esiDataService.getPagingRequest<Asset>(url)
  }

  public getCharacterWallet(characterId: number): Observable<number> {
    const url = environment.esiBaseUrl + `/characters/${characterId}/wallet/`;
    return this.esiDataService.getRequest<number>(url)
  }
}
