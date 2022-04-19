import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay, Subject } from 'rxjs';
import { ShoppingEntry } from '..';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {

  private shoppingList$ : BehaviorSubject<ShoppingEntry[]> = new BehaviorSubject<ShoppingEntry[]>([{
    quantity: 0,
    type_id: 0,
    item_name: "",
    buy_price: 0,
    sell_price: 0,
    profit: 0
  }]);
  public ShoppingListObs: Observable<ShoppingEntry[]>;

  constructor() { 
    this.ShoppingListObs = this.shoppingList$
      .asObservable()
      .pipe(shareReplay(1));
  }

  public AddShoppingEntry(item : ShoppingEntry) {
    let entries = this.shoppingList$.value;

    if(!entries) {
      entries = [];
    }

    let exists = false;
    for(let i = 0; i< entries.length; i++) {
      const curEntry = entries[i];

      if(curEntry.type_id === item.type_id)
      {       
        curEntry.quantity += item.quantity;
        entries[i] = curEntry;
        exists = true;
      }
    }

    if(!exists)
      entries.push(item);
    
    this.shoppingList$.next(entries);
  }

  public RemoveShoppingEntry(item : ShoppingEntry) {
    let entries = this.shoppingList$.value;

    if(entries) {
      const indexOfEntry = entries.findIndex(entry => entry.type_id === item.type_id);

      if(indexOfEntry >= 0) {
        entries.splice(indexOfEntry);
        this.shoppingList$.next(entries);
      }
    }
  }

  public GetEntryById(typeId: number): ShoppingEntry | null {
    let entries = this.shoppingList$.value;

    if(entries) {
      const indexOfEntry = entries.findIndex(entry => entry.type_id == typeId)
      if(indexOfEntry >= 0) {
        return entries[indexOfEntry];
      }
    }

    return null;
  }

  public ClearShoppingList() {
    this.shoppingList$.next([]);
  }

  public ContainsItem(type_id: number): boolean {
    const result = this.shoppingList$.value?.some(entry => entry.type_id == type_id);

    if(result)
      return result;
    else 
      return false;
  }
}
