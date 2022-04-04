import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, switchMap, tap } from 'rxjs';
import { AuthService, IAuthResponseData } from '../auth.service';
import { CharacterService } from '../character.service';
import { AuthenticatedCharacter, Portrait, ServerStatus } from '../models';

@Component({
  selector: 'app-eve-login',
  templateUrl: './eve-login.component.html',
  styleUrls: ['./eve-login.component.scss']
})
export class EveLoginComponent implements OnInit{
  public static auth = false;
  
  public statusObs : Observable<ServerStatus> | undefined;
  public characterObs : Observable<AuthenticatedCharacter> | undefined;
  public characterPortraitObs : Observable<Portrait> | undefined;

  constructor(
    private authService: AuthService,
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

  public static validateAuth() {
      const token = sessionStorage.getItem('token');

      if(token)
        if (AuthService.isAuthValid(token)) {
          EveLoginComponent.auth = true;
          console.log('auth is true');
            return;
        }

      sessionStorage.removeItem('token');
      console.log('removed token from storage');
      EveLoginComponent.auth = false;
  }

  public get authValid() {
      EveLoginComponent.validateAuth();
      return EveLoginComponent.auth;
  }

  public async revokeAuth() {
      const token = sessionStorage.getItem('token');

      if(token) {
        const auth = JSON.parse(token) as IAuthResponseData;
        this.authService.revokeToken(auth.refresh_token).then();
        sessionStorage.removeItem('token');
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
