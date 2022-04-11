import { Injectable } from '@angular/core';
import { map, Observable, ReplaySubject, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { ItemDetails } from 'src/app/models';
import { EsiDataRepositoryService } from 'src/app/repositories/esi-data-repository.service';
import { ItemIdentifier } from '../models/item-identifier';

@Injectable({
  providedIn: 'root'
})
export class ItemSearchService {

  private itemCount$ : Subject<number> = new ReplaySubject(1);
  public ItemCountObs: Observable<number>;

  private currentItem$ : Subject<ItemIdentifier> = new ReplaySubject(1);
  public CurrentItemObs: Observable<ItemIdentifier>;

  public CurrentItemDetailsObs: Observable<ItemDetails>;

  constructor(esiDataService: EsiDataRepositoryService) {
    this.CurrentItemObs = this.currentItem$.asObservable()
                                      .pipe(
                                        shareReplay(1));

    this.CurrentItemDetailsObs = this.CurrentItemObs.pipe(
      switchMap(item => esiDataService.getItemDetails(item.id))
      );

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
