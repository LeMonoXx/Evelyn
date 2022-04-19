import { Component, OnInit } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { EsiDataRepositoryService } from 'src/app/repositories';
import { ShoppingEntry } from 'src/app/shared';
import { ShoppingListService } from 'src/app/shared/services/shopping-list.service';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit {
  public shoppingListObs: Observable<ShoppingEntry[]>;

  constructor(private shoppingListService: ShoppingListService,
    private esiDataService: EsiDataRepositoryService) { }

  ngOnInit(): void {

    this.shoppingListObs = this.shoppingListService.ShoppingListObs
      .pipe(
        map(entries => entries.filter(entry => entry.type_id > 0)),
        tap(entries => console.log("shoppingEntries ", entries),
        ));
  }

  public getImageForItem(typeId: number): string {
    return this.esiDataService.getImageUrlForType(typeId, 32);
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
}
