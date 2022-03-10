import { Component, OnInit } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {

  // Url des Authorization-Servers
  issuer: 'https://login.eveonline.com/v2/oauth/authorize/', 
  
  tokenEndpoint: 'https://login.eveonline.com/v2/oauth/token',

  // Url der Angular-Anwendung
  // An diese URL sendet der Authorization-Server den Access Code
  redirectUri: window.location.origin + '/index.html',

  // Name der Angular-Anwendung
  clientId: 'spa',

  // Rechte des Benutzers, die die Angular-Anwendung wahrnehmen möchte
  scope: 'openid profile email offline_access api',

  // Code Flow (PKCE ist standardmäßig bei Nutzung von Code Flow aktiviert)
  responseType: 'code',

  requireHttps: false

}

@Component({
  selector: 'app-eve-login',
  templateUrl: './eve-login.component.html',
  styleUrls: ['./eve-login.component.scss']
})
export class EveLoginComponent implements OnInit {

  constructor(private oauthService: OAuthService) { }

  ngOnInit(): void {

  }

  startLogin(): void {
    console.log("startLogin started");
  }
}
