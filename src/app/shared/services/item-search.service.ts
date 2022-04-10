import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, shareReplay, startWith, Subject } from 'rxjs';
import { ItemIdentifier } from '../models/item-identifier';

@Injectable({
  providedIn: 'root'
})
export class ItemSearchService {

  private itemCount$ : Subject<number> = new ReplaySubject(1);
  public ItemCountObs: Observable<number>;

  private currentItem$ : Subject<ItemIdentifier> = new ReplaySubject(1);
  public CurrentItemObs: Observable<ItemIdentifier>;

  constructor() {
    this.CurrentItemObs = this.currentItem$.asObservable()
                                      .pipe(
                                        shareReplay(1));

    this.ItemCountObs = this.itemCount$.asObservable()
                                      .pipe(
                                        startWith(1), 
                                        shareReplay(1));
   }

  public setCurrentItem(item : ItemIdentifier) {
    this.currentItem$.next(item);
  }

  public setItemCount(count : number) {
    this.itemCount$.next(count);
  }
}
