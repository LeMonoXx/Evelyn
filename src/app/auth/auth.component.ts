import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-auth',
    template: ``,
})
export class AuthComponent implements OnInit {

    constructor(
        private readonly authService: AuthService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
    ) { }

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
        await this.authService.getAuthToken(code, encodedRandomString).toPromise();

        sessionStorage.removeItem('challenge');
    
        this.router.navigate(['/']).then();
      }
      else {
        console.log('code or encodedRandomString empty');
      }
    }
}