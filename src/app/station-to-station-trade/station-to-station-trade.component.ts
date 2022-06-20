import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, map, Observable, ReplaySubject, Subject } from 'rxjs';
import { AuthService, IAuthResponseData } from '../auth';
import { ItemDetails, StationDetails, StructureDetails } from '../models';
import { calculateTaxPercentBySkillLevel, ItemIdentifier, 
  ItemSearchService, JitaIVMoon4CaldariNavyAssemblyPlant_STATION_ID, MJ5F9BEANSTAR_STRUCTURE_ID, 
  MJ5F9_REGION_ID, 
  ShippingService, 
  ShoppingEntry, ShoppingListService, UniverseService } from '../shared';

@Component({
  selector: 'app-station-to-station-trade',
  templateUrl: './station-to-station-trade.component.html',
  styleUrls: ['./station-to-station-trade.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StationToStationTradeComponent implements OnInit {

  public currentItemObs: Observable<ItemIdentifier>;
  public currentSellStructureObs: Observable<StructureDetails>;
  public shippingServiceObs: Observable<ShippingService>;
  public numberCountObs: Observable<number>;
  public itemDetailsObs: Observable<ItemDetails>;
  public currentBuyStationObs: Observable<StationDetails>;
  public authStatusObs: Observable<IAuthResponseData | null>;
  public characterSaleTaxPercentObs: Observable<number>;
  public shoppingListObs: Observable<ShoppingEntry[]>;
  public currentRegionObs: Observable<number> = new BehaviorSubject<number>(MJ5F9_REGION_ID);

  public routerItemNameSubject: Subject<string> = new BehaviorSubject("");

  constructor(
    private itemSearchService: ItemSearchService,
    private authService: AuthService,
    private shoppingListService: ShoppingListService,
    private readonly route: ActivatedRoute) {
      this.currentItemObs = this.itemSearchService.CurrentItemObs;
      this.numberCountObs = this.itemSearchService.ItemCountObs;
      this.itemDetailsObs = this.itemSearchService.CurrentItemDetailsObs;
      this.authStatusObs = this.authService.authObs;    
      this.currentBuyStationObs = this.itemSearchService.BuyStationObs;
      this.currentSellStructureObs = this.itemSearchService.SellStructureObs;
      this.shippingServiceObs = this.itemSearchService.ShippingServiceObs;
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
