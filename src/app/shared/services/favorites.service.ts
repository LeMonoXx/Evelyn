import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay, Subscription, tap } from 'rxjs';
import { getStoredFavoriteItems, ItemIdentifier, storeFavoriteItems } from '..';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService implements OnDestroy {

  private favoriteItems$ : BehaviorSubject<ItemIdentifier[]> = new BehaviorSubject<ItemIdentifier[]>([{
    id: 0,
    name: ""
  }]);

  public FavoriteItemsObs: Observable<ItemIdentifier[]>;
  private favItemsSubscription: Subscription;

  constructor() { 

    const storedList = getStoredFavoriteItems();
    if(storedList) {
      this.favoriteItems$ = new BehaviorSubject(storedList);
    }

    this.FavoriteItemsObs = this.favoriteItems$
      .asObservable()
      .pipe(
        tap(entries => storeFavoriteItems(entries)),
        shareReplay(1));

    this.favItemsSubscription = this.FavoriteItemsObs.subscribe();
  }
  
  ngOnDestroy(): void {
    this.favItemsSubscription.unsubscribe();
  }

  public AddFavoriteItem(item : ItemIdentifier) {
    let entries = this.favoriteItems$.value;

    if(!entries) {
      entries = [];
    }

    if(!entries.some(e => e.id === item.id))
      entries.push(item);
    
    this.favoriteItems$.next(entries);
  }

  public RemoveFavoriteItem(item : ItemIdentifier) {
    let entries = this.favoriteItems$.value;

    if(entries) {
      const indexOfEntry = entries.findIndex(entry => entry.id === item.id);

      if(indexOfEntry >= 0) {
        entries.splice(indexOfEntry);
        this.favoriteItems$.next(entries);
      }
    }
  }

  public GetEntryById(typeId: number): ItemIdentifier | null {
    let entries = this.favoriteItems$.value;

    if(entries) {
      const indexOfEntry = entries.findIndex(entry => entry.id == typeId)
      if(indexOfEntry >= 0) {
        return entries[indexOfEntry];
      }
    }

    return null;
  }

  public ClearFavoriteItems() {
    this.favoriteItems$.next([]);
  }

  public ContainsItem(type_id: number): boolean {
    const result = this.favoriteItems$.value?.some(entry => entry.id == type_id);

    if(result)
      return result;
    else 
      return false;
  }
}
