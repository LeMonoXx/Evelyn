import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay, Subscription, tap } from 'rxjs';
import { getStoredFavoriteItems, ItemTradeFavorite, storeFavoriteItems } from '..';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService implements OnDestroy {

  private favoriteItems$ : BehaviorSubject<ItemTradeFavorite[]> = new BehaviorSubject<ItemTradeFavorite[]>([{type_id: 0} as ItemTradeFavorite]);

  public FavoriteItemsObs: Observable<ItemTradeFavorite[]>;
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

  public AddFavoriteItem(item : ItemTradeFavorite) {
    let entries = this.favoriteItems$.value;

    if(!entries) {
      entries = [];
    }

    if(!entries.some(e => e.type_id === item.type_id))
      entries.push(item);
    
    this.favoriteItems$.next(entries);
  }

  public RemoveFavoriteItem(item : ItemTradeFavorite) {
    let entries = this.favoriteItems$.value;

    if(entries) {
      const indexOfEntry = entries.findIndex(entry => entry.type_id === item.type_id);

      if(indexOfEntry >= 0) {
        entries.splice(indexOfEntry);
        this.favoriteItems$.next(entries);
      }
    }
  }

  public GetEntryById(typeId: number): ItemTradeFavorite | null {
    let entries = this.favoriteItems$.value;

    if(entries) {
      const indexOfEntry = entries.findIndex(entry => entry.type_id == typeId)
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
    const result = this.favoriteItems$.value?.some(entry => entry.type_id == type_id);

    if(result)
      return result;
    else 
      return false;
  }
}
