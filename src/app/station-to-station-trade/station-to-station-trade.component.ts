import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { AuthService, IAuthResponseData } from '../auth';
import { ItemDetails } from '../models';
import { AutocompleteService } from '../repositories/autocomplete.service';
import { calculateTaxPercentBySkillLevel, GeneralStation, ItemIdentifier, 
  ItemSearchService, MJ5F9_REGION_ID, ShippingRoute, ShippingService, 
  ShoppingEntry, ShoppingListService, } from '../shared';

@Component({
  selector: 'app-station-to-station-trade',
  templateUrl: './station-to-station-trade.component.html',
  styleUrls: ['./station-to-station-trade.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StationToStationTradeComponent implements OnInit {

  public currentItemObs: Observable<ItemIdentifier>;
  public currentendStationObs: Observable<GeneralStation>;

  public shippingServiceObs: Observable<ShippingService>;
  public shippingRouteObs: Observable<ShippingRoute>;
  
  public numberCountObs: Observable<number>;
  public itemDetailsObs: Observable<ItemDetails>;
  public currentstartStationObs: Observable<GeneralStation>;
  public authStatusObs: Observable<IAuthResponseData | null>;
  public characterSaleTaxPercentObs: Observable<number>;
  public shoppingListObs: Observable<ShoppingEntry[]>;
  public currentRegionObs: Observable<number> = new BehaviorSubject<number>(MJ5F9_REGION_ID);

  public routerItemNameSubject: Subject<string> = new BehaviorSubject("");
  public initalTypesLoadObs: Observable<any>;

  constructor(
    private autoCompleteService: AutocompleteService,
    private itemSearchService: ItemSearchService,
    private authService: AuthService,
    private shoppingListService: ShoppingListService,
    private readonly route: ActivatedRoute) {
      this.initalTypesLoadObs = this.autoCompleteService.getGetAllItems();

      this.currentItemObs = this.itemSearchService.CurrentItemObs;
      this.numberCountObs = this.itemSearchService.ItemCountObs;
      this.itemDetailsObs = this.itemSearchService.CurrentItemDetailsObs;
      this.authStatusObs = this.authService.authObs;    
      this.currentstartStationObs = this.itemSearchService.StartStationObs;
      this.currentendStationObs = this.itemSearchService.EndStationObs;
      this.shippingServiceObs = this.itemSearchService.ShippingServiceObs;
      this.shippingRouteObs = this.itemSearchService.ShippingRouteObs;
    }

  ngOnInit(): void {

    this.characterSaleTaxPercentObs = this.itemSearchService.AccoutingSkillLevelObs.pipe(
      map(level => calculateTaxPercentBySkillLevel(level)));

      this.shoppingListObs = this.shoppingListService.ShoppingListObs
      .pipe(map(entries => entries.filter(entry => entry.type_id > 0)));

      const inputItemName = this.route.snapshot.queryParamMap.get('item');
      
      if(inputItemName) {
        this.routerItemNameSubject.next(inputItemName);
      }
  }
}
