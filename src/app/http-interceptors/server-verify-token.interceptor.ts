import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth';

/**
 * Interceptor to add the x-evie-token header when communicating with the backend server.
 */
@Injectable()
export class ServerVerifyTokenInterceptor implements HttpInterceptor {

    constructor() { }
    
    public intercept(request: HttpRequest<any>, next: HttpHandler) {



        if (request.url === environment.esiVerifyUrl) {

            const token = AuthService.authValue;

            if(token) {
                request = request.clone({
                    setHeaders: {
                        'Authorization':  `Bearer ${token.access_token}`,
                        'X-User-Agent': `Evelyn ${environment.version}, by MonoXx Kashada`                       
                    },
                });
            }
        }

        return next.handle(request);
    }
}