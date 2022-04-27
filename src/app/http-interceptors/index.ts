import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { EsiUserAgentInterceptor } from './esi-user-agent.interceptor';
import { ItemSearchCacheInterceptor } from './item-search-cache.interceptor';
import { SdeCacheInterceptor } from './sde-cache.interceptor';
import { ServerTokenInterceptor } from './server-token.interceptor';
import { ServerVerifyTokenInterceptor } from './server-verify-token.interceptor';

export const httpInterceptorProviders = [
    {provide: HTTP_INTERCEPTORS, useClass: EsiUserAgentInterceptor, multi: true},   
    {provide: HTTP_INTERCEPTORS, useClass: ServerTokenInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ServerVerifyTokenInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ItemSearchCacheInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: SdeCacheInterceptor, multi: true}
];