import { Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { ItemIdentifier } from '../item-identifier';

@Injectable({
  providedIn: 'root'
})
export class ItemSearchService {


  private currentItem$ : Subject<ItemIdentifier> = new ReplaySubject(1);
  public CurrentItemObs: Observable<ItemIdentifier>;

  constructor() {
    this.CurrentItemObs = this.currentItem$.asObservable();
   }

  public setCurrentItem(item : ItemIdentifier) {
    this.currentItem$.next(item);
  }
}
