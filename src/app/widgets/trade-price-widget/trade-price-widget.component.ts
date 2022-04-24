import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FavoritesService, ItemTradeFavorite } from 'src/app/shared';

@Component({
  selector: 'app-trade-price-widget',
  templateUrl: './trade-price-widget.component.html',
  styleUrls: ['./trade-price-widget.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TradePriceWidgetComponent implements OnInit {

  @Input()
  public inputItem: ItemTradeFavorite;

  constructor() { }

  ngOnInit(): void {
  }

}
