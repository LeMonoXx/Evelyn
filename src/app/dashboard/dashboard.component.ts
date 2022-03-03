import { Component, OnInit } from '@angular/core';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {

  // Url des Authorization-Servers
  issuer: 'http://idsvr4.azurewebsites.net',

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
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private oauthService: OAuthService) { }

  ngOnInit(): void {
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.oauthService.setupAutomaticSilentRefresh();
    this.oauthService.initLoginFlow();
  }

}
