import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, ReplaySubject, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { ItemDetails } from 'src/app/models';
import { GeneralStation, GetShippingRoute, ShippingRoute, ShippingService } from '..';
import { storeSelectedShippingService, storeStartStation, storeEndStation } from '../functions/storage';
import { ItemIdentifier } from '../models/item-identifier';
import { UniverseService } from './universe.service';

@Injectable({
  providedIn: 'root'
})
export class ItemSearchService {

  private startStation$ : Subject<GeneralStation> = new ReplaySubject(1);
  public StartStationObs: Observable<GeneralStation>;

  private endStation$ : Subject<GeneralStation> = new ReplaySubject(1);
  public EndStationObs: Observable<GeneralStation>;

  private shippingService$ : Subject<ShippingService> = new ReplaySubject(1);
  public ShippingServiceObs: Observable<ShippingService>;

  public ShippingRouteObs: Observable<ShippingRoute>;

  private accoutingSkillLevel$ : Subject<number> = new ReplaySubject(1);
  public AccoutingSkillLevelObs: Observable<number>;

  private itemCount$ : Subject<number> = new ReplaySubject(1);
  public ItemCountObs: Observable<number>;

  private currentItem$ : Subject<ItemIdentifier> = new ReplaySubject(1);
  public CurrentItemObs: Observable<ItemIdentifier>;
  
  public CurrentItemDetailsObs: Observable<ItemDetails>;

  constructor(universeService: UniverseService) {
    this.CurrentItemObs = this.currentItem$.asObservable().pipe(
      shareReplay(1));

    this.CurrentItemDetailsObs = this.CurrentItemObs.pipe(
      switchMap(item => universeService.getItemDetails(item.id))
      );

    this.ItemCountObs = this.itemCount$.asObservable().pipe(
        startWith(1), 
        shareReplay(1));

    this.AccoutingSkillLevelObs = this.accoutingSkillLevel$.asObservable().pipe(
        startWith(1), 
        shareReplay(1));

    this.StartStationObs = this.startStation$.asObservable().pipe(
      shareReplay(1));

    this.EndStationObs = this.endStation$.asObservable().pipe(
      shareReplay(1));

    this.ShippingServiceObs = this.shippingService$.asObservable().pipe(
      shareReplay(1));  
      
    this.ShippingRouteObs = combineLatest([this.StartStationObs, this.EndStationObs, this.ShippingServiceObs]).pipe(
      map(([startStation, endStation, service]) => {
        if(service.id !== 0) {
          const route = GetShippingRoute(service, startStation, endStation);

          if(route)
          return route;
        }

        return ({     
          startSystem: 0,
          endSystem: 0,
          cubicMeterPrice: 0,
          collateral: 0,
          maxVolume: 0,
          maxCollateral: 0});
      }))
  }

  public setCurrentItem(item : ItemIdentifier) {
    this.currentItem$.next(item);
  }

  public setItemCount(count : number) {
    this.itemCount$.next(count);
  }

  public setAccountingSkillLevel(level: number) {
    this.accoutingSkillLevel$.next(level);
  }

  public setStartStation(station: GeneralStation) {
    storeStartStation(station);
    this.startStation$.next(station);
  }

  public setEndStation(structure: GeneralStation) {
    storeEndStation(structure);
    this.endStation$.next(structure);
  }

  public setShippingService(service: ShippingService) {
    storeSelectedShippingService(service);
    this.shippingService$.next(service);
  }
}
