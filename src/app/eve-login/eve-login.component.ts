import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, switchMap, tap } from 'rxjs';
import { AuthService, IAuthResponseData } from '../auth.service';
import { CharacterService } from '../character.service';
import { AuthenticatedCharacter, Portrait, ServerStatus } from '../models';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';

@Component({
  selector: 'app-eve-login',
  templateUrl: './eve-login.component.html',
  styleUrls: ['./eve-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EveLoginComponent implements OnInit{

  public statusObs : Observable<ServerStatus> | undefined;
  public characterObs : Observable<AuthenticatedCharacter> | undefined;
  public characterPortraitObs : Observable<Portrait> | undefined;

  constructor(
    private authService: AuthService,
    public esiDataService: EsiDataRepositoryService,
    private characterService: CharacterService
    ) { }

  public ngOnInit(): void {
      this.statusObs = this.characterService
      .getServerStatus();

      this.characterObs = this.characterService
      .getAuthenticatedCharacterInfo()
      .pipe(
        tap(c => console.log(c))
      );

      this.characterPortraitObs = this.characterObs.pipe(
        switchMap(authChar => this.characterService.getCharacterImage(authChar.CharacterID))
      );
  }

  public get authValid() : boolean {
      return AuthService.hasValidAccessToken();
  }

  public async revokeAuth() {
      const token = AuthService.getAccessToken();

      if(token) {
        const auth = JSON.parse(token) as IAuthResponseData;
        this.authService.revokeToken(auth.refresh_token).then();
        AuthService.removeAccessToken();
      }
  }

  public async doAuth() {
      const {encodedRandomString, redirectUrl, state} = await AuthService.startAuth();

      sessionStorage.setItem('challenge', encodedRandomString);
      sessionStorage.setItem('state', state);

      window.location.href = redirectUrl;
  }

  startLogin(): void {
    console.log("startLogin started");
    this.doAuth();
  }
}
