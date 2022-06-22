import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, take } from 'rxjs';
import { copyToClipboard, ShoppingEntry, ShoppingListService, toMultiBuyString, UniverseService } from 'src/app/shared';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit {

  @Input()
  public shoppingList$: Observable<ShoppingEntry[]>;

  constructor(private shoppingListService: ShoppingListService,
    private universeService: UniverseService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void { }

  public getImageForItem(typeId: number): string {
    return this.universeService.getImageUrlForType(typeId, 32);
  }

  public calcProfitSum(entries: ShoppingEntry[]) {
    const result = entries.reduce((accumulator, current) => {
      return accumulator + current.profit;
    }, 0);
    return result;
  }

  public calcBuySum(entries: ShoppingEntry[]) {
    const result = entries.reduce((accumulator, current) => {
      return accumulator + current.buy_price;
    }, 0);
    return result;
  }

  public clearShoppingList(): void {
    this.shoppingListService.ClearShoppingList();
  }

  public copyAsMultibuyFormat(): void {
    this.shoppingList$.pipe(
      take(1),
      map(entries => {
        let multiBuyStr = "";
        entries.forEach(entry => {
          multiBuyStr+= toMultiBuyString(entry.item_name, entry.quantity);
        });

        this.copy(multiBuyStr);
      })
    ).subscribe();
  }

  public copy(text: string) {
    copyToClipboard(text);
    
    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
}
