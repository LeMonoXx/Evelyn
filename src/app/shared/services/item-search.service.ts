import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { ItemDetails, StationDetails, StructureDetails } from 'src/app/models';
import { storeSelectedBuyMode, storeSelectedShippingService, storeSelectedStation, storeSelectedStructure } from '../functions/storage';
import { BuyMode } from '../models/buy-mode';
import { ItemIdentifier } from '../models/item-identifier';
import { ShippingService } from '../models/shipping/shipping-service';
import { UniverseService } from './universe.service';

@Injectable({
  providedIn: 'root'
})
export class ItemSearchService {

  private buyStation$ : Subject<StationDetails> = new ReplaySubject(1);
  public BuyStationObs: Observable<StationDetails>;

  private sellStructure$ : Subject<StructureDetails> = new ReplaySubject(1);
  public SellStructureObs: Observable<StructureDetails>;

  private shippingService$ : Subject<ShippingService> = new ReplaySubject(1);
  public ShippingServiceObs: Observable<ShippingService>;

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

    this.BuyStationObs = this.buyStation$.asObservable().pipe(
      shareReplay(1));

    this.SellStructureObs = this.sellStructure$.asObservable().pipe(
      shareReplay(1));

    this.ShippingServiceObs = this.shippingService$.asObservable().pipe(
      shareReplay(1));
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

  public setBuyStation(station: StationDetails) {
    storeSelectedStation(station);
    this.buyStation$.next(station);
  }

  public setSellStructure(structure: StructureDetails) {
    storeSelectedStructure(structure);
    this.sellStructure$.next(structure);
  }

  public setShippingService(service: ShippingService) {
    storeSelectedShippingService(service);
    this.shippingService$.next(service);
  } 
}
