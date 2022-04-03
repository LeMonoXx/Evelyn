import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthService, IAuthResponseData } from '../auth.service';
import { CharacterService } from '../character.service';

  // Url des Authorization-Servers
 // export const issuer: 'https://login.eveonline.com/v2/oauth/authorize/';
  
 // export const tokenEndpoint: 'https://login.eveonline.com/v2/oauth/token';

@Component({
  selector: 'app-eve-login',
  templateUrl: './eve-login.component.html',
  styleUrls: ['./eve-login.component.scss']
})
export class EveLoginComponent {
  public static auth = false;
  
  public statusObs = this.characterService
              .getServerStatus()
              .pipe(
                tap(s => console.log(s))
              );

  constructor(
    private authService: AuthService,
    private characterService: CharacterService
    ) { }

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

  public getStatus(): Observable<string> {
   return this.statusObs;
  }
}
