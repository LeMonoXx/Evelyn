import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService, IAuthResponseData } from '../auth.service';

/**
 * Interceptor to add the x-evie-token header when communicating with the backend server.
 */
@Injectable()
export class ServerTokenInterceptor implements HttpInterceptor {

    public intercept(request: HttpRequest<any>, next: HttpHandler) {

        if (request.url.includes(environment.esiBaseUrl)) {

            const token = AuthService.getAccessToken();

            if(token) {
                request = request.clone({
                    setHeaders: {'Authorization':  'Bearer ' + token.access_token },
                });
            }
        }

        return next.handle(request);
    }
}