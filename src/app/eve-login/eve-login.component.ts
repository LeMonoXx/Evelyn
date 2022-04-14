import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService, IAuthResponseData } from '../auth.service';
import { AuthenticatedCharacter, Portrait, ServerStatus } from '../models';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';
import { CharacterService } from '../shared';

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
  public hasValidAuthenticationObs : Observable<boolean>;
  public authStatus: Observable<IAuthResponseData | null>;

  constructor(
    private authService: AuthService,
    public esiDataService: EsiDataRepositoryService,
    private characterService: CharacterService
    ) { }

  public ngOnInit(): void {
      this.authStatus = this.authService.authObs;

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

  public async revokeAuth() {
      const token = AuthService.authValue;

      if(token) {
        this.authService.revokeToken(token).then();
      }
  }

  public async doAuth() {
      const {encodedRandomString, redirectUrl, state} = await this.authService.startAuth();

      sessionStorage.setItem('challenge', encodedRandomString);
      sessionStorage.setItem('state', state);

      window.location.href = redirectUrl;
  }

  startLogin(): void {
    console.log("startLogin started");
    this.doAuth();
  }
}
