import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { filter, map, Observable, tap } from 'rxjs';
import { AuthService, IAuthResponseData } from '../auth';
import { FavoritesService, ItemTradeFavorite } from '../shared';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {

  public favoritesObs: Observable<ItemTradeFavorite[]>;
  public authStatusObs: Observable<IAuthResponseData | null>;

  constructor(
    favoritesService: FavoritesService,
    private authService: AuthService) {
    this.authStatusObs = this.authService.authObs;    
    this.favoritesObs = favoritesService.FavoriteItemsObs.pipe(
      filter(x => !!x),
      map(entries => entries.filter(e => e.type_id > 0))
    );
   }

  ngOnInit(): void {
  }

}
