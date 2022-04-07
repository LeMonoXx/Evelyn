import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'eve-item-station-price',
  templateUrl: './item-station-price.component.html',
  styleUrls: ['./item-station-price.component.scss']
})
export class ItemStationPriceComponent implements OnInit {

  @Input()
  public itemId : number = 0;
  @Input()
  public stationId : number = 1038457641673;

  constructor() { }

  ngOnInit(): void {
  }

}
