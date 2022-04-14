import { Injectable } from '@angular/core';
import { base64urlEncode } from './auth';

@Injectable({
    providedIn: 'root',
  })
export class AppCookieService {
    private cookieStore: any = {};

    constructor() {
        this.parseCookies(document.cookie);
    }

    public parseCookies(cookies = document.cookie) {
        this.cookieStore = {};

        if (!!cookies === false) { 
          return; 
        }

        const cookiesArr = cookies.split(';');
        for (const cookie of cookiesArr) {
            const cookieArr = cookie.split('=');
            this.cookieStore[cookieArr[0].trim()] = cookieArr[1];
        }
    }

    get(key: string) {
        this.parseCookies();
        return !!this.cookieStore[key] ? this.cookieStore[key] : null;
    }

    remove(key: string) {
      document.cookie = `${key} = ; expires=Thu, 1 jan 1990 12:00:00 UTC; path=/`;
    }

    set(key: string, value: string) {
        //const escaped =  base64urlEncode(value);
        document.cookie = key + '=' + (value || '') + "; path=/";
    }
}