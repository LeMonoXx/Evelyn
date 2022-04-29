import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { IAuthResponseData, AuthService } from '../auth';
import { StructureDetails, ItemDetails, StationDetails } from '../models';
import { calculateTaxPercentBySkillLevel, IndustryService, ItemIdentifier, 
  ItemSearchService, MJ5F9_REGION_ID, ShoppingEntry, ShoppingListService } from '../shared';
import { ProductionSettingsService } from './services/production-settings.service';

@Component({
  selector: 'app-production',
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.scss']
})
export class ProductionComponent implements OnInit {
  public currentItemObs: Observable<ItemIdentifier>;
  public currentSellStructureObs: Observable<StructureDetails>;
  public numberCountObs: Observable<number>;
  public itemDetailsObs: Observable<ItemDetails>;
  public currentBuyStationObs: Observable<StationDetails>;
  public authStatusObs: Observable<IAuthResponseData | null>;
  public characterSaleTaxPercentObs: Observable<number>;
  public shoppingListObs: Observable<ShoppingEntry[]>;
  public currentRegionObs: Observable<number> = new BehaviorSubject<number>(MJ5F9_REGION_ID);
  public routerItemNameSubject: Subject<string> = new BehaviorSubject("");
  public runsObs: Observable<number>;
  public meLevelObs: Observable<number>;
  public teLevelObs: Observable<number>;
  
  constructor(
    private itemSearchService: ItemSearchService,
    private authService: AuthService,
    private shoppingListService: ShoppingListService,
    private productionSettingsService: ProductionSettingsService,
    private readonly route: ActivatedRoute) {
      this.currentItemObs = this.itemSearchService.CurrentItemObs;
      this.numberCountObs = this.itemSearchService.ItemCountObs;
      this.itemDetailsObs = this.itemSearchService.CurrentItemDetailsObs;
      this.authStatusObs = this.authService.authObs;    
      this.currentBuyStationObs = this.itemSearchService.BuyStationObs;
      this.currentSellStructureObs = this.itemSearchService.SellStructureObs;
      this.runsObs = this.productionSettingsService.RunsObs;
      this.meLevelObs = this.productionSettingsService.MeLevelObs;
      this.teLevelObs = this.productionSettingsService.TeLevelObs;
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
