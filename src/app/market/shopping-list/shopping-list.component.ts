import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, tap } from 'rxjs';
import { copyToClipboard, ShoppingEntry, ShoppingListService, UniverseService } from 'src/app/shared';

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
  
  public copy(text: string) {
    copyToClipboard(text);
    
    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
}
