import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, debounceTime, filter, from, map, mergeMap, Observable, of, shareReplay, startWith, Subject, switchMap, toArray } from 'rxjs';
import { IAuthResponseData, AuthService } from '../auth';
import { StructureDetails, ItemDetails, StationDetails, BlueprintDetails } from '../models';
import { EvepraisalDataRepositoryService } from '../repositories/evepraisal-data-repository.service';
import { calculateMaterialQuantity, calculateRequiredRuns, calculateTaxPercentBySkillLevel, getPriceForN, IndustryService, ItemIdentifier, 
  ItemSearchService, JITA_REGION_ID, MarketService, MJ5F9_REGION_ID, ShoppingEntry, ShoppingListService, UniverseService } from '../shared';
import { ManufacturingCostEntry } from './models/manufacturing-cost-entry';
import { SubComponent, ManufacturingCalculation } from '.';
import { ProductionSettingsService } from './services/production-settings.service';

@Component({
  selector: 'app-production',
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.scss'],
  encapsulation: ViewEncapsulation.None
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

  public mainBPOItemObs: Observable<ItemDetails>
  public mainBPODetailsObs: Observable<BlueprintDetails>;
  public subComponentsObs: Observable<SubComponent[]>;
  public subBPOsManufacturingCostsObs: Observable<ManufacturingCalculation[]>;

  public runsObs: Observable<number>;
  // me level for the main bpo
  public meLevelObs: Observable<number>;
  // me level for the sub component-bpos
  public subMeLevelObs: Observable<number>;
  public teLevelObs: Observable<number>;


  constructor(
    private industryService: IndustryService,
    private universeService: UniverseService,
    private marketService: MarketService,
    private autoCompleteService : EvepraisalDataRepositoryService,
    private itemSearchService: ItemSearchService,
    private authService: AuthService,
    private shoppingListService: ShoppingListService,
    private productionSettingsService: ProductionSettingsService,
    private readonly route: ActivatedRoute) {
      this.currentItemObs = this.itemSearchService.CurrentItemObs;
      this.numberCountObs = this.itemSearchService.ItemCountObs;
      this.authStatusObs = this.authService.authObs;    
      this.currentBuyStationObs = this.itemSearchService.BuyStationObs;
      this.currentSellStructureObs = this.itemSearchService.SellStructureObs;
      this.runsObs = this.productionSettingsService.RunsObs;
      this.meLevelObs = this.productionSettingsService.MeLevelObs;
      this.subMeLevelObs = this.productionSettingsService.SubMeLevelObs;
      this.teLevelObs = this.productionSettingsService.TeLevelObs;
    }

  public ngOnInit(): void { 
    this.characterSaleTaxPercentObs = this.itemSearchService.AccoutingSkillLevelObs.pipe(
      map(level => calculateTaxPercentBySkillLevel(level)));

      this.shoppingListObs = this.shoppingListService.ShoppingListObs
      .pipe(map(entries => entries.filter(entry => entry.type_id > 0)));

      const inputItemName = this.route.snapshot.queryParamMap.get('item');
      
      if(inputItemName) {
        this.routerItemNameSubject.next(inputItemName);
      }

    this.itemDetailsObs = this.itemSearchService.CurrentItemDetailsObs.pipe(
      switchMap(itemIdentifier => {
        if(itemIdentifier.name?.toLowerCase().endsWith("blueprint")) {
          return of(itemIdentifier);
        }
        var bpoItem = itemIdentifier.name + " Blueprint";
        var switchResult = this.autoCompleteService.getAutoCompleteSuggestions(bpoItem).pipe(
         // map(result => result.find(r => r.name === bpoItem)),
         map(result => result[0]),
          filter(x => !!x && !!x.id),
          switchMap(bpoItem => this.universeService.getItemDetails(bpoItem?.id))
        );
        return switchResult;
      }),
    );

    this.mainBPODetailsObs = this.itemDetailsObs.pipe(
      filter(i => !!i),
      switchMap(item => this.industryService.getBlueprintDetails(item.type_id)),
      shareReplay(1)
    );

    const materialItemObs = this.mainBPODetailsObs.pipe(
      filter(x => !!x),
      map(details => details.activities.manufacturing.materials),
      mergeMap(materials =>
        from(materials).pipe(
          mergeMap(material => this.universeService.getItemDetails(material.typeID).pipe(
            map(item => ({material, item } as SubComponent ))
            )
          ),
          toArray()
        )),
      shareReplay(1)
      );

    const bpoComponentsObs = materialItemObs.pipe(
      mergeMap(components => 
        from(components).pipe(
          // we could filter here for components that should not be build by a BPO.
          // if its filtered out, the component is calculated as bought form market.
         // filter(c => c.item.type_id !== 17478),
          mergeMap(component => this.autoCompleteService.getAutoCompleteSuggestions(component.item.name + " Blueprint").pipe(
            filter(x => !!x && x.length > 0),
            map(items => items[0]),
            mergeMap(item => this.industryService.getBlueprintDetails(item.id).pipe(
              mergeMap(bpo => this.universeService.getItemDetails(bpo.blueprintTypeID).pipe(
                map(bpoItem => ({bpo: bpo, bpoItem: bpoItem})
              ),
              map(result => {
                 component.bpo = result.bpo;
                 component.bpoItem = result.bpoItem;                 
                 return component;
                })
            ))
          )),
          toArray(),
          debounceTime(40),
        ),
      ),
    )));

    const allRequiredComponents = combineLatest([this.runsObs, materialItemObs, bpoComponentsObs, this.currentBuyStationObs, this.subMeLevelObs]).pipe(
      debounceTime(120),
      map(([runs, subMaterials, bpoComponents, buyStation, meLevel]) => {
        subMaterials.forEach(component => {

          const exists = bpoComponents.some(c => c.item.type_id === component.material.typeID);
          if(!exists) {
            bpoComponents.push(component);
          }
        })
        return ({ runs, bpoComponents, buyStation, meLevel });
      }
    ), shareReplay(1));

    this.subComponentsObs = allRequiredComponents.pipe(     
      debounceTime(100),
      map(c => c.bpoComponents), 
      shareReplay(1)
    );

    this.subBPOsManufacturingCostsObs = combineLatest([allRequiredComponents, this.meLevelObs]).pipe(
        mergeMap(([allReqComp, mainBpoMe]) =>
        from(allReqComp.bpoComponents).pipe(
          mergeMap(component => {
            if(component.bpo) {
              const reqAllRunsAmount = calculateMaterialQuantity(component.material.quantity, allReqComp.runs, allReqComp.meLevel);
              component.requiredAmount = reqAllRunsAmount;
              const subComponentRuns = calculateRequiredRuns(component.material.typeID, component.requiredAmount, component.bpo);
              component.requiredRuns = subComponentRuns.reqRuns;

              return this.getBPOCalculation(
                                subComponentRuns.reqRuns, 
                                component.bpo, 
                                allReqComp.buyStation, 
                                allReqComp.meLevel).pipe(
              map(calc => (
                { item: component.item, 
                  bpoCost: calc, 
                  subComponent: component,
                  reqAmount: component.requiredAmount, 
                  overflow: subComponentRuns.overflow 
                })));

            } else {
              const reqQuantity = calculateMaterialQuantity(component.material.quantity, allReqComp.runs, mainBpoMe);
              component.requiredAmount = reqQuantity;
              return this.getManufacturingCost(component.material.typeID, reqQuantity, allReqComp.buyStation).pipe(
                map(c => [c]),
                map(calc => (
                  { item: component.item, 
                    bpoCost: calc, 
                    subComponent: component,
                    reqAmount: component.requiredAmount, 
                    overflow: 0 }))
              );
            }
          }),
          filter(x => !!x && x.bpoCost && x.bpoCost.length > 0),
          toArray(),
          debounceTime(40),
          map(entries => entries.sort((a, b) => 
          a.item.type_id - b.item.type_id))
        )), shareReplay(1));
  }

  
  private getBPOCalculation(
    runs: number, 
    bpo: BlueprintDetails,
    buyStation: StationDetails,
    meLevel: number)
    : Observable<ManufacturingCostEntry[]> {
      const materials = bpo.activities.manufacturing.materials;
      return from(materials).pipe(
        mergeMap(material => {
          const reqQuantity = calculateMaterialQuantity(material.quantity, runs, meLevel);
          return this.getManufacturingCost(material.typeID, reqQuantity, buyStation);
        }),
        toArray(), 
        debounceTime(40),
        map(entries => entries.sort((a, b) => 
        a.typeID - b.typeID)),
        shareReplay(1)
      );
    }

  public getManufacturingCost(typeId: number, quantity: number, buyStation: StationDetails): Observable<ManufacturingCostEntry> {
    return this.universeService.getItemDetails(typeId).pipe(
      switchMap(itemDetails => this.marketService.getRegionMarketForItem(itemDetails.type_id, JITA_REGION_ID).pipe(
        map(entries => entries.filter(marketEntry => marketEntry.location_id ===buyStation.station_id)),
        map(marketEntries => ({ itemDetails: itemDetails, marketEntries: marketEntries })),
        map(entry => {
          const nPrice = getPriceForN(entry.marketEntries, quantity);
          return {
            quantity_total: quantity,
            typeID: entry.itemDetails.type_id,
            itemName: entry.itemDetails.name,
            single_buyPrice: nPrice.averagePrice,
            total_buyPrice: nPrice.totalPrice,
            total_volume: entry.itemDetails.packaged_volume * quantity
          };
        })
        )
      )
    );
  }
}
