import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import jwt_decode from "jwt-decode";
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface IJWTToken {
    scp: string[] | string;
    jti: string;
    kid: string;
    sub: string;
    azp: string;
    name: string;
    owner: string;
    exp: number;
    iss: string;
}

export interface IAuthResponseData {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    // private static refreshInterval;

    public HasValidAuthenticationObs: Observable<boolean>;

    private static defaultHeaders = {'Content-Type': 'application/x-www-form-urlencoded'};

    private static scopes = [
        'publicData',
        'esi-location.read_location.v1',
        'esi-skills.read_skills.v1',
        'esi-wallet.read_character_wallet.v1',
        'esi-universe.read_structures.v1',
        'esi-assets.read_assets.v1',
        'esi-markets.structure_markets.v1',
        'esi-markets.read_character_orders.v1',
        'esi-contracts.read_character_contracts.v1',
        'esi-universe.read_structures.v1'
    ];

    public static async startAuth() {
        const randomChallengeString = AuthService.createRandomString(32);
        const encodedRandomString = AuthService.base64urlEncode(randomChallengeString);

        const hashedString = await AuthService.hashSHA256(encodedRandomString);
        const encodedHash = AuthService.base64urlEncode(hashedString);

        const randomStateString = AuthService.createRandomString(32);
        const state = AuthService.base64urlEncode(randomStateString);

        const params = new HttpParams()
            .set('response_type', 'code')
            .set('redirect_uri', encodeURI(environment.ssoCallbackURL))
            .set('client_id', environment.clientID)
            .set('scope', AuthService.scopes.join(' '))
            .set('code_challenge', encodedHash)
            .set('code_challenge_method', 'S256')
            .set('state', state);

        const redirectUrl = 'https://login.eveonline.com/v2/oauth/authorize/?' + params.toString();

        return {
            encodedRandomString,
            redirectUrl,
            state,
        };
    }

    /**
     * Checks if a auth token is still valid.
     *
     * Not valid if:
     * - No token saved.
     * - Token expiry is less than one minute from now.
     */
    public static isAuthValid(token?: IAuthResponseData): boolean {
        if (!token) {
            return false;
        }

        const jwt = jwt_decode<IJWTToken>(token.access_token);

        const maxExpiryTime = (Date.now() / 1000) + 60; // Now + one minute.

        return (jwt.exp > maxExpiryTime);
    }

    public static getAccessToken() : IAuthResponseData | null {
        const tokenJson = sessionStorage.getItem('token');

        let tokenObject: IAuthResponseData | null = null;

        if(tokenJson) {
            tokenObject = JSON.parse(tokenJson) as IAuthResponseData;
            return tokenObject;
        }

        return tokenObject;
    }

    public static removeAccessToken(): void {
        sessionStorage.removeItem('token');
    }

    public static hasValidAccessToken() : boolean {
        const token = AuthService.getAccessToken();
  
        if(token) {
          if (AuthService.isAuthValid(token)) {
            return true;
          }
  
          AuthService.removeAccessToken();
         console.log('removed token from storage');
        }
  
        return false;
    }

    /**
     * Checks if a refresh token is still valid.
     *
     * Not valid if:
     * - No token saved.
     * - Token expiry is more than 30 days ago.
     *
     * NOTE: Does not consider revocation of the refresh token.
     */
    public static isRefreshValid(authReponseData: IAuthResponseData | null) {
        if (!authReponseData) {
            return false;
        }

        const jwt = jwt_decode<IJWTToken>(authReponseData.access_token);

        const maxRefreshTokenAge = (Date.now() / 1000) - 2592000; // Now - 30 days.

        return jwt.exp > maxRefreshTokenAge;
    }

    public static getRefreshToken(): string {
        const token = this.getAccessToken();  

        if(token) {
            return token.refresh_token;
        }

        return "";
    }

    private static createRandomString(bytes: number) {
        const bytesArray = new Uint8Array(bytes);
        return String.fromCharCode(...crypto.getRandomValues(bytesArray));
    }

    private static base64urlEncode(str: string) {
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    private static async hashSHA256(str: string) {
        return String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))));
    }

    constructor(
        private readonly http: HttpClient,
    ) {
            this.HasValidAuthenticationObs = new Observable((observer) => {
                const token = AuthService.getAccessToken();
                var valid = AuthService.hasValidAccessToken();
          
                if(valid)
                    observer.next(valid);
                
                console.log("Token was not valid anymore. Refresh started.")
                
                this.refreshToken(token).then(newToken => {
                    console.log("refreshToken.then: " + newToken);
                    sessionStorage.setItem('token', JSON.stringify(newToken));
                    observer.next(AuthService.hasValidAccessToken())
                });
               ;
            })

     }

    public async getAuthToken(code: string, codeVerifier: string): Promise<IAuthResponseData> {

        const body = new HttpParams()
            .set('grant_type', 'authorization_code')
            .set('code', code)
            .set('client_id', environment.clientID)
            .set('code_verifier', codeVerifier);

        return this.http.post<any>('https://login.eveonline.com/v2/oauth/token', body, {
            headers: AuthService.defaultHeaders,
        }).toPromise();
    }

    public async refreshToken(authReponseData: IAuthResponseData | null) {
        if (!authReponseData) {
            return;
        }

        const body = new HttpParams()
            .set('grant_type', 'refresh_token')
            .set('refresh_token', authReponseData.refresh_token)
            .set('client_id', environment.clientID);

        return this.http.post<any>('https://login.eveonline.com/v2/oauth/token', body, {
            headers: AuthService.defaultHeaders,
        }).toPromise();
    }

    public async revokeToken(authReponseData: IAuthResponseData | null) {
        if (!authReponseData) {
            return;
        }

        const body = new HttpParams()
            .set('token', authReponseData.refresh_token)
            .set('token_type_hint', 'refresh_token')
            .set('client_id', environment.clientID);

        return this.http.post<any>('https://login.eveonline.com/v2/oauth/revoke', body, {
            headers: AuthService.defaultHeaders,
        }).toPromise();
    }
}