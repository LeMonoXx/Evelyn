import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, IAuthResponseData } from '../auth.service';

  // Url des Authorization-Servers
 // export const issuer: 'https://login.eveonline.com/v2/oauth/authorize/';
  
 // export const tokenEndpoint: 'https://login.eveonline.com/v2/oauth/token';

@Component({
  selector: 'app-eve-login',
  templateUrl: './eve-login.component.html',
  styleUrls: ['./eve-login.component.scss']
})
export class EveLoginComponent implements OnInit {

  public static auth = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
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

  public async ngOnInit() {
    const state = this.route.snapshot.queryParamMap.get('state');
    const savedState = sessionStorage.getItem('state');

    if (!state || !savedState || state !== savedState) {
        // Something went wrong, clear everything so the user can try again.
        sessionStorage.clear();
        this.router.navigate(['/']);
        console.log('Something went wrong, clear everything so the user can try again.');
        return;
    }

    sessionStorage.removeItem('state');

    const code = this.route.snapshot.queryParamMap.get('code');
    const encodedRandomString = sessionStorage.getItem('challenge');

    if(code && encodedRandomString) {
      console.log('code and encodedRandomString existing');
      const token = await this.authService.getAuthToken(code, encodedRandomString);

      sessionStorage.setItem('token', JSON.stringify(token));
      sessionStorage.removeItem('challenge');
  
      this.router.navigate(['/']).then();
    }
    else {
      console.log('code or encodedRandomString empty');
    }
  }

  startLogin(): void {
    console.log("startLogin started");
    this.doAuth();
  }
}
