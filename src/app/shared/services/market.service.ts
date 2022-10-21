import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';
import { catchError, filter, map, Observable, of, shareReplay } from 'rxjs';
import { AuthService } from 'src/app/auth';
import { MarketEntry, MarketHistory, Prices, MarketOrder } from 'src/app/models';
import { EsiDataRepositoryService } from 'src/app/repositories/esi-data-repository.service';
import { environment } from 'src/environments/environment';
import { JitaIVMoon4CaldariNavyAssemblyPlant_STATION_ID, JITA_REGION_ID } from '../models/Ids';
import { GeneralStation } from '../models/structure/general-station';

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  constructor(
    private esiDataService: EsiDataRepositoryService, 
    private snackBar: MatSnackBar) { }

  
  public getStructureMarketEntries(structureId: number) : Observable<MarketEntry[]> {
    const url = environment.esiBaseUrl + `/markets/structures/${structureId}/`
    return this.esiDataService.getPagingRequest<MarketEntry>(url);
  }

  public getStructureMarketForItem(structureId: number, itemId: number, isBuyOrder: boolean): Observable<MarketEntry[]> {
      return this.getStructureMarketEntries(structureId).pipe(
        map(entries => entries.filter(e => e.type_id == itemId && e.is_buy_order == isBuyOrder)
                        .sort((a, b) => a.price - b.price)
        ), 
        shareReplay(1),
        catchError((error: HttpErrorResponse) => {
          console.log("Errror:", error);
          this.snackBar.open(error?.error?.error, undefined, { duration: 10000, verticalPosition: 'top' });
         return of([({ type_id: itemId }) as MarketEntry ]);
        }
      ));
  }

  public getMarketEntries(itemId: number, station: GeneralStation, isBuyOrder: boolean) : Observable<MarketEntry[]> {
    if(station.isStructure) {
      return this.getStructureMarketForItem(station.station_Id, itemId, isBuyOrder);
    }    
    else {
      const orderType = isBuyOrder ? "buy" : "sell";
      return this.getRegionMarketForItem(itemId, station.region_id, orderType);
    }
  }

  // This fixed method for jita is required for colateral calculation -> those are ALWAYS Jita prices.
  public getJitaRegionMarketForItem(itemId: number, orderType: string = "sell"): Observable<MarketEntry[]> {
    const regionId = JITA_REGION_ID;
    // We do not need to load pages of the result because we filter for a type_id, and the service response in a single page
    const url = environment.esiBaseUrl + `/markets/${regionId}/orders/?order_type=${orderType}&page=1&type_id=${itemId}`
    return this.esiDataService.getRequest<MarketEntry[]>(url).pipe(
              // we get the market for the whole region. But we only want given buy-station.
              map(entries => entries.filter(entry => entry.location_id === JitaIVMoon4CaldariNavyAssemblyPlant_STATION_ID)),
      map(entries => {
        return entries.sort((a, b) => a.price - b.price)
      }));
  }

  public getRegionMarketForItem(itemId: number, regionId: number, orderType: string = "sell"): Observable<MarketEntry[]> {
    // We do not need to load pages of the result because we filter for a type_id, and the service response in a single page
    const url = environment.esiBaseUrl + `/markets/${regionId}/orders/?order_type=${orderType}&page=1&type_id=${itemId}`

    return this.esiDataService.getRequest<MarketEntry[]>(url).pipe(
      map(entries => {
        return entries.sort((a, b) => a.price - b.price)
      }),
      shareReplay(1),
      catchError((error: HttpErrorResponse) => {
        console.log("Errror:", error);
        this.snackBar.open(error?.error?.error, undefined, { duration: 10000, verticalPosition: 'top' });
       return of([({ type_id: itemId }) as MarketEntry ]);
      }
    ));
  }

  public getHistoricalDataForItem(itemId: number, regionId: number): Observable<MarketHistory[]> {
    const url = environment.esiBaseUrl + `/markets/${regionId}/history/?type_id=${itemId}`

    return this.esiDataService.getRequest<MarketHistory[]>(url).pipe(
      map(entries => {
        entries.forEach(entry => {
          entry.evelyn_date = moment(entry.date).toDate();
        })

        return entries;
      })
    );
  }

  public getAllAdjustedPrices(): Observable<Prices[]> {
    const url = environment.esiBaseUrl + '/markets/prices/'

    return this.esiDataService.getRequest<Prices[]>(url);
  }

  public getAdjustedPriceForItem(itemId: number): Observable<Prices> {
    const url = environment.esiBaseUrl + '/markets/prices/'

    return this.esiDataService.getRequest<Prices[]>(url).pipe(
      map(entries =>  {
        const result = entries.find(e => e.type_id === itemId);

        if(!result)
          return ({ adjusted_price: 0, average_price: 0, type_id: itemId });

        return result;
      } ));
  }

  public getMarketOrders(stationId: number, characterId: number, isBuyOrder: boolean): Observable<MarketOrder[]> {
    const url = environment.esiBaseUrl + `/characters/${characterId}/orders/`;

    return this.esiDataService.getRequest<MarketOrder[]>(url).pipe(
      filter(orders => orders != null && orders.length > 0),
      map(orders => {
        var filtered = orders.filter(order => order.location_id === stationId);

        // The "is_buy_order" is only provided in the json when its true.
        // that means we can not only filter for "false"...
        if(isBuyOrder === true) {
          filtered = filtered.filter(order => order.is_buy_order === isBuyOrder);
        } else {
          filtered = filtered.filter(order => order.is_buy_order === isBuyOrder || order.is_buy_order === undefined);
        }

        return filtered;
        })
      );
  }

  public openMarketDetails(type_id: number) : Observable<any> {
    const url = environment.esiBaseUrl + `/ui/openwindow/marketdetails/?token=${AuthService.authValue?.access_token}&type_id=${type_id}`;
    console.log(url);
    return this.esiDataService.postRequest(url, null);
  }
}
