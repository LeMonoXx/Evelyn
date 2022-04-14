import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import jwt_decode from "jwt-decode";
import { BehaviorSubject, first, map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppCookieService } from './app-cookie.service';
import { base64urlEncode, createRandomString, hashSHA256 } from './auth';
import { ESI_API_SCOPES } from './auth/scopes';
import { CustomUrlEncoder } from './repositories/custom-url-encoder';

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

    private static authSubject: BehaviorSubject<IAuthResponseData | null>;
    public authObs: Observable<IAuthResponseData  | null>;
    private refreshTokenTimeout: NodeJS.Timeout;

    public static get authValue(): IAuthResponseData | null {
        return AuthService.authSubject.value;
    }

    public static setAuthValue(auth: IAuthResponseData): void {
        AuthService.authSubject.next(auth);
    }

    private static defaultHeaders = {'Content-Type': 'application/x-www-form-urlencoded'};

    public async startAuth() {
        const randomChallengeString = createRandomString(32);
        const encodedRandomString = base64urlEncode(randomChallengeString);

        const hashedString = await hashSHA256(encodedRandomString);
        const encodedHash = base64urlEncode(hashedString);

        const randomStateString = createRandomString(32);
        const state = base64urlEncode(randomStateString);

        const params = new HttpParams()
            .set('response_type', 'code')
            .set('redirect_uri', encodeURI(environment.ssoCallbackURL))
            .set('client_id', environment.clientID)
            .set('scope', ESI_API_SCOPES.join(' '))
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
    public isAuthValid(token?: IAuthResponseData): boolean {
        if (!token) {
            return false;
        }

        const jwt = jwt_decode<IJWTToken>(token.access_token);

        const maxExpiryTime = (Date.now() / 1000) + 60; // Now + one minute.

        return (jwt.exp > maxExpiryTime);
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
    public isRefreshValid(authReponseData: IAuthResponseData | null) {
        if (!authReponseData) {
            return false;
        }

        const jwt = jwt_decode<IJWTToken>(authReponseData.access_token);

        const maxRefreshTokenAge = (Date.now() / 1000) - 2592000; // Now - 30 days.

        return jwt.exp > maxRefreshTokenAge;
    }

    public getRefreshToken(): string {
        const token = AuthService.authValue;  

        if(token) {
            return token.refresh_token;
        }

        return "";
    }


    public startRefreshTokenTimer() {
        // parse json object from base64 encoded jwt token
        const jwtToken = AuthService.authValue;

        if(jwtToken && jwtToken.expires_in > 0) {
            // set a timeout to refresh the token a minute before it expires
            const timeoutMs = + (jwtToken.expires_in - 60) * 1000;
            console.log("setup refreshTokenTimeout - timout: ", timeoutMs);
            this.refreshTokenTimeout = setTimeout(() => {
                console.log("refreshTokenTimeout executing started!");
                // we use first(). that will result in a single execution, 
                // the subscription gets destroyed afterwards
                this.refreshToken(jwtToken.refresh_token).pipe(
                    map(auth => {
                        if(auth) {
                            this.cookieService.set("refresh_token", auth.refresh_token);
                            AuthService.setAuthValue(auth);
                        }
                    }),
                    first())
                    .subscribe();
            }, timeoutMs);
        }
    }

    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }

    constructor(
        private readonly http: HttpClient,
        private readonly cookieService: AppCookieService) {
        
        let refresh_tokenCookie = cookieService.get("refresh_token") as string;

        AuthService.authSubject = new BehaviorSubject<IAuthResponseData | null>(null);
        this.authObs = AuthService.authSubject.asObservable().pipe(
            map(r => {
                console.log("authObs: ", r)
            return r;
            })
        );
        
        if(refresh_tokenCookie && refresh_tokenCookie != "null") {
                    
            if(!refresh_tokenCookie.endsWith("==")) {
                refresh_tokenCookie += "==";
                console.log("refresh_tokenCookie added ==", refresh_tokenCookie);
            }
                

            console.log("found existing refresh_tokenCookie => init", refresh_tokenCookie);
            this.refreshToken(refresh_tokenCookie).pipe(first()).subscribe();
           // this.authSubject = new BehaviorSubject<IAuthResponseData | null>(auth);
        } else {
            console.log("no existing refresh_tokenCookie");
        }

     }

    public getAuthToken(code: string, codeVerifier: string): Observable<IAuthResponseData> {

        const body = new HttpParams()
            .set('grant_type', 'authorization_code')
            .set('code', code)
            .set('client_id', environment.clientID)
            .set('code_verifier', codeVerifier);

        return this.http.post<any>('https://login.eveonline.com/v2/oauth/token', body, {
            headers: AuthService.defaultHeaders,
        }).pipe(
            map(auth => {
                this.cookieService.set("refresh_token", auth.refresh_token);
                AuthService.authSubject.next(auth);
                this.startRefreshTokenTimer();
                return auth;
        }));
    }

    public refreshToken(refresh_token: string): Observable<IAuthResponseData | null> {
        if (!refresh_token) {
            console.log("refreshToken canceled! authReponseData was null.")
            return of(null);
        }

        console.log("refresh with: ", refresh_token);

        const body = new HttpParams({encoder: new CustomUrlEncoder() })
            .set('grant_type', 'refresh_token')
            .set('refresh_token', refresh_token)
            .set('client_id', environment.clientID);

        return this.http.post<IAuthResponseData>('https://login.eveonline.com/v2/oauth/token', body).pipe(
            map(auth => {
                this.cookieService.set("refresh_token", auth.refresh_token);
                AuthService.authSubject.next(auth);
                this.startRefreshTokenTimer();
                return auth;
        }));
    }

    public async revokeToken(authReponseData: IAuthResponseData | null) {
        if (!authReponseData) {
            return;
        }

        this.stopRefreshTokenTimer();
        AuthService.authSubject.next(null);

        const body = new HttpParams()
            .set('token', authReponseData.refresh_token)
            .set('token_type_hint', 'refresh_token')
            .set('client_id', environment.clientID);

        return this.http.post<any>('https://login.eveonline.com/v2/oauth/revoke', body, {
            headers: AuthService.defaultHeaders,
        }).toPromise();
    }
}