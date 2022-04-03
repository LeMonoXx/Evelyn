import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { EsiUserAgentInterceptor } from './esi-user-agent.interceptor';
import { ServerTokenInterceptor } from './server-token.interceptor';

export const httpInterceptorProviders = [
    {provide: HTTP_INTERCEPTORS, useClass: EsiUserAgentInterceptor, multi: true},   
    {provide: HTTP_INTERCEPTORS, useClass: ServerTokenInterceptor, multi: true},
];