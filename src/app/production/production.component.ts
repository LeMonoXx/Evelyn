import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, filter, from, map, mergeMap, Observable, of, shareReplay, Subject, switchMap, take, tap, toArray } from 'rxjs';
import { IAuthResponseData, AuthService } from '../auth';
import { StructureDetails, ItemDetails, StationDetails, BlueprintDetails, Material } from '../models';
import { EvepraisalDataRepositoryService } from '../repositories/evepraisal-data-repository.service';
import { calculateMaterialQuantity, calculateRequiredRuns, calculateTaxPercentBySkillLevel, getPriceForN, IndustryService, ItemIdentifier, 
  ItemSearchService, JITA_REGION_ID, MarketService, MJ5F9_REGION_ID, ShoppingEntry, ShoppingListService, UniverseService } from '../shared';
import { ManufacturingCostEntry } from './models/manufacturing-cost-entry';
import { SubComponent } from './models/sub-component';
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
  public runsObs: Observable<number>;
  public meLevelObs: Observable<number>;
  public teLevelObs: Observable<number>;

  public mainBPOItemObs: Observable<ItemDetails>
  public mainBPODetailsObs: Observable<BlueprintDetails>;
  public subComponentsObs: Observable<SubComponent[]>;
  public subBPOsObs: Observable<SubComponent[]>;
  public subBPOsManufacturingCostsObs: Observable<{ 
    item: ItemDetails, 
    reqAmount?: number, 
    subComponent?: SubComponent,
    bpoCost: ManufacturingCostEntry[],
    overflow: number
  }[]>;

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
      this.itemDetailsObs = this.itemSearchService.CurrentItemDetailsObs;
      this.authStatusObs = this.authService.authObs;    
      this.currentBuyStationObs = this.itemSearchService.BuyStationObs;
      this.currentSellStructureObs = this.itemSearchService.SellStructureObs;
      this.runsObs = this.productionSettingsService.RunsObs;
      this.meLevelObs = this.productionSettingsService.MeLevelObs;
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

    this.mainBPODetailsObs = this.currentItemObs.pipe(
      switchMap(item => this.industryService.getBlueprintDetails(item.id)),
      shareReplay(1)
    );

    this.subComponentsObs = this.mainBPODetailsObs.pipe(
      map(details => details.activities.manufacturing.materials),
      mergeMap(materials =>
        from(materials).pipe(
          mergeMap(material => this.universeService.getItemDetails(material.typeID).pipe(
            map(item => ({material, item }))
            )
          ),
          toArray()
        )),
      shareReplay(1)
      );

    this.subBPOsObs = this.subComponentsObs.pipe(
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
                map(bpoItem => ({bpo, bpoItem})
              ),
              map(result => {
                 component.bpo = result.bpo;
                 component.bpoItem = result.bpoItem;
                 return component;
                }),
            ))
          )),
          toArray(),
        ),
      ),
    )));

    const allRequiredComponents = combineLatest([this.runsObs, this.subComponentsObs, this.subBPOsObs, this.currentBuyStationObs, this.meLevelObs]).pipe(
      map(([runs, subComponents, subBPOs, buyStation, meLevel]) => {
        subComponents.forEach(component => {

          const exists = subBPOs.some(c => c.item.type_id === component.material.typeID);
          if(!exists) {
            subBPOs.push(component);
          }
        })
        return ({ runs, subComponents, subBPOs, buyStation, meLevel });
      }
    ));


    this.subBPOsManufacturingCostsObs = allRequiredComponents.pipe(
        mergeMap(allReqComp =>
        from(allReqComp.subBPOs).pipe(
          mergeMap(component => {
            const reqAllRunsAmount = calculateMaterialQuantity(component.material.quantity, allReqComp.runs, allReqComp.meLevel);
            component.requiredAmount = reqAllRunsAmount;

            if(component.bpo) {

              const subComponentRuns = calculateRequiredRuns(component.material.typeID, component.requiredAmount, component.bpo);

              return this.getBPOCalculation(
                                subComponentRuns.reqRuns, 
                                component.bpo, 
                                allReqComp.buyStation, 
                                allReqComp.meLevel).pipe(
              take(1),
              map(calc => (
                { item: component.item, 
                  bpoCost: calc, 
                  subComponent: component,
                  reqAmount: component.requiredAmount, 
                  overflow: subComponentRuns.overflow 
                })));

            } else {
              var materialCopy: Material = { typeID: component.material.typeID, quantity: component.material.quantity };
              materialCopy.quantity = calculateMaterialQuantity(materialCopy.quantity, allReqComp.runs, allReqComp.meLevel);
              return this.getManufacturingCost(allReqComp.runs, materialCopy, allReqComp.buyStation).pipe(
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
          map(entries => entries.sort((a, b) => 
          a.item.type_id - b.item.type_id))
        )));
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
        //  console.log(`material: ${material.typeID} before: ${material.quantity}`);
          var materialCopy: Material = { typeID: material.typeID, quantity: material.quantity };
          materialCopy.quantity = calculateMaterialQuantity(materialCopy.quantity, runs, meLevel);
       //  console.log(`material: ${material.typeID} after: ${materialCopy.quantity}`);
          return this.getManufacturingCost(runs, materialCopy, buyStation);
        }),
        toArray(), 
        map(entries => entries.sort((a, b) => 
        a.typeID - b.typeID))
      );
    }

  public getManufacturingCost(runs: number, material: Material, buyStation: StationDetails): Observable<ManufacturingCostEntry> {
    return this.universeService.getItemDetails(material.typeID).pipe(
      switchMap(itemDetails => this.marketService.getRegionMarketForItem(itemDetails.type_id, JITA_REGION_ID).pipe(
        map(entries => entries.filter(marketEntry => marketEntry.location_id ===buyStation.station_id)),
        map(marketEntries => ({ runs: runs, itemDetails: itemDetails, material: material, marketEntries: marketEntries })),
        map(entry => {
          const nPrice = getPriceForN(entry.marketEntries, entry.material.quantity);
          return {
            quantity: entry.material.quantity,
            quantity_total: entry.material.quantity * entry.runs,
            typeID: entry.itemDetails.type_id,
            itemName: entry.itemDetails.name,
            single_buyPrice: nPrice.averagePrice,
            total_buyPrice: nPrice.totalPrice
          };
        })
        )
      )
    );
  }
}
