import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http"

import { Injectable } from "@angular/core"
import { map, of, shareReplay } from "rxjs"

@Injectable()
export class ItemSearchCacheInterceptor implements HttpInterceptor {
    
    private cache: Map<string, HttpResponse<any>> = new Map()

    public intercept(request: HttpRequest<any>, next: HttpHandler) {
        if(request.method !== "GET") {    
            return next.handle(request)
        }

        if(!(request.url.includes('assets/typeIDs.json'))) {
            return next.handle(request)
        }

        if(request.headers.get("reset")) {
            this.cache.delete(request.url)
        }
        
        const cachedResponse = this.cache.get(request.url)

        if(cachedResponse) {
            return of(cachedResponse.clone())
        }else {
            return next.handle(request).pipe(
                map(stateEvent => {
                    if(stateEvent instanceof HttpResponse) {
                        this.cache.set(request.url, stateEvent.clone())
                    }
                    return stateEvent;
                }),
                shareReplay(1));
        }
    }    
}