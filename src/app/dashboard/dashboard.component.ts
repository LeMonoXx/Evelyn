import { Component, OnInit } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { FavoritesService, ItemTradeFavorite } from '../shared';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public favoritesObs: Observable<ItemTradeFavorite[]>;

  constructor(favoritesService: FavoritesService) {
    this.favoritesObs = favoritesService.FavoriteItemsObs.pipe(
      tap(entries => console.log(entries))
    );
   }

  ngOnInit(): void {
  }

}
