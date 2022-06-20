import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, from, map, mergeMap, Observable, of, share, shareReplay, startWith, Subject, switchMap, take, tap, toArray } from 'rxjs';
import { IAuthResponseData, AuthService } from '../auth';
import { StructureDetails, ItemDetails, StationDetails, BlueprintDetails } from '../models';
import { EvepraisalDataRepositoryService } from '../repositories/evepraisal-data-repository.service';
import { calculateMaterialQuantity, calculateRequiredRuns, CalculateShippingCostForBundle, calculateTaxPercentBySkillLevel, getPriceForN, getRigMEforItem, IndustryService, ItemIdentifier, 
  ItemSearchService, JITA_REGION_ID, MarketService, MJ5F9_REGION_ID, ShippingService, ShoppingEntry, ShoppingListService, UniverseService } from '../shared';
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
  public shippingServiceObs: Observable<ShippingService>;
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

  public indicatorSubject = new BehaviorSubject<boolean>(false);
  public isLoadingObs = this.indicatorSubject.asObservable().pipe(distinctUntilChanged());

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
      this.shippingServiceObs = this.itemSearchService.ShippingServiceObs;
      this.runsObs = this.productionSettingsService.RunsObs;
      this.meLevelObs = this.productionSettingsService.MeLevelObs;
      this.subMeLevelObs = this.productionSettingsService.SubMeLevelObs;
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
      distinctUntilChanged(),
      shareReplay(1)
    );

    this.mainBPODetailsObs = this.itemDetailsObs.pipe(
      filter(i => !!i),
      switchMap(item => this.industryService.getBlueprintDetails(item.type_id)),
      shareReplay(1)
    );

    const mainBPOProductRigMe = this.mainBPODetailsObs.pipe(
      map(bpo => bpo.activities.manufacturing.products[0].typeID),
      switchMap(typeId => this.universeService.getItemDetails(typeId)),
      switchMap(item => this.universeService.getItemGroup(item.group_id).pipe(
        map(group => ({ item: item, group: group })),
        switchMap(value => this.universeService.getItemCategory(value.group.category_id).pipe(
          map(category => ({ item: item, category: category }))
        ))
      )),
      map(value => getRigMEforItem(value.item, value.category))
    );

    const materialItemObs = this.mainBPODetailsObs.pipe(
      filter(x => !!x),
      map(details => details.activities.manufacturing.materials),
      mergeMap(materials =>
        from(materials).pipe(
          mergeMap(material => this.universeService.getItemDetails(material.typeID).pipe(
            map(item => ({material, item } as SubComponent )),
            switchMap(subC => this.universeService.getItemGroup(subC.item.group_id).pipe(
              map(group => ({ subC: subC, group: group })),
              switchMap(value => this.universeService.getItemCategory(value.group.category_id).pipe(
                map(category => {
                  subC.itemCategory = category;
                  return subC;
                })
              ))
            ))
            )
          ),
          toArray()
        )),
      shareReplay(1),
      distinctUntilChanged());

    const bpoComponentsObs = materialItemObs.pipe(
      mergeMap(components => 
        from(components).pipe(
          // we could filter here for components that should not be build by a BPO.
          // if its filtered out, the component is calculated as bought form market.
         // filter(c => c.item.type_id !== 17478),
          mergeMap(component => this.autoCompleteService.getAutoCompleteSuggestions(component.item.name + " Blueprint").pipe(
            map(x => x?.filter(e => e.name.startsWith(component.item.name))),
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
                }),
                switchMap(subC => this.universeService.getItemGroup(subC.item.group_id).pipe(
                  map(group => ({ subC: subC, group: group })),
                  switchMap(value => this.universeService.getItemCategory(value.group.category_id).pipe(
                    map(category => {
                      subC.itemCategory = category;
                      return subC;
                    })
                  ))
                ))
            ))
          )),
          toArray(),
        ),
      ),
      shareReplay(1),
      distinctUntilChanged(),
      debounceTime(250)
    )));

    const allRequiredComponents: Observable<{ runs: number, bpoComponents: SubComponent[], buyStation: StationDetails, meLevel: number }> = 
      combineLatest([this.runsObs, materialItemObs, bpoComponentsObs, this.currentBuyStationObs, this.subMeLevelObs]).pipe(
      debounceTime(250),
      map(([runs, subMaterials, bpoComponents, buyStation, meLevel]) => {
        subMaterials.forEach(component => {
          const exists = bpoComponents.some(c => c.item.type_id === component.material.typeID);
          if(!exists) {
            bpoComponents.push(component);
          }
        })
        return ({ runs, bpoComponents, buyStation, meLevel });
        }
      ),
      shareReplay(1)
    );

    this.subComponentsObs = allRequiredComponents.pipe(     
      map(c => c.bpoComponents), 
      shareReplay(1)
    );

    this.subBPOsManufacturingCostsObs = combineLatest(
      [
        allRequiredComponents, 
        this.meLevelObs, 
        mainBPOProductRigMe, 
        this.currentSellStructureObs,
        this.shippingServiceObs
      ]).pipe(
      debounceTime(50),
      tap(_ => this.indicatorSubject.next(true)),
        mergeMap((
          [
            allReqComp, 
            mainBpoMe, 
            mainBPOProductRigMe, 
            sellStructure,
            shippingService
          ]) =>
        from(allReqComp.bpoComponents).pipe(
          mergeMap(component => {
            const reqAllRunsAmount = calculateMaterialQuantity(component.material.quantity, allReqComp.runs, mainBpoMe, mainBPOProductRigMe.modifier);
            component.requiredAmount = reqAllRunsAmount;

            if(component.bpo) {           
              const subComponentRuns = calculateRequiredRuns(component.material.typeID, component.requiredAmount, component.bpo);
              component.requiredRuns = subComponentRuns.reqRuns;
              component.overflow = subComponentRuns.overflow;

              const subRigME = getRigMEforItem(component.item, component.itemCategory);
 
              component.prodFacilityName = subRigME.facilityName;
              return this.getBpoMaterialBuyCost(
                                subComponentRuns.reqRuns, 
                                component.bpo, 
                                allReqComp.buyStation, 
                                sellStructure,
                                allReqComp.meLevel,
                                subRigME.modifier,
                                shippingService).pipe(
              map(calc => (
                { item: component.item, 
                  bpoCost: calc, 
                  subComponent: component,
                  reqAmount: component.requiredAmount, 
                })));

            } else {
              return this.getBuyCost(component.material.typeID, component.requiredAmount, allReqComp.buyStation, sellStructure, shippingService).pipe(
                map(c => [c]),
                map(calc => (
                  { item: component.item, 
                    bpoCost: calc, 
                    subComponent: component,
                    reqAmount: component.requiredAmount 
                  }))
              );
            }
          }),
          filter(x => !!x && x.bpoCost && x.bpoCost.length > 0),
          toArray(),
          debounceTime(40),
          map(entries => entries.sort((a, b) => 
          a.item.type_id - b.item.type_id)),
        )),  
        debounceTime(100),    
        tap(_ => this.indicatorSubject.next(false)),
        shareReplay(1));
  }

  
  private getBpoMaterialBuyCost(
    runs: number, 
    bpo: BlueprintDetails,
    buyStation: StationDetails,
    sellStructure: StructureDetails,
    meLevel: number,
    rigMELevel: number,
    shippingService: ShippingService)
    : Observable<ManufacturingCostEntry[]> {
      const materials = bpo.activities.manufacturing.materials;
      return from(materials).pipe(
        mergeMap(material => {
          const reqQuantity = calculateMaterialQuantity(material.quantity, runs, meLevel, rigMELevel);
              // we give the sell-station as "buy-station", because we want to check if 
              // the price on location is even cheaper than buying elsewhere with shipping
          return this.getBuyCost(material.typeID, reqQuantity, buyStation, sellStructure, shippingService);
        }),
        toArray(), 
        debounceTime(50),
        map(entries => entries.sort((a, b) => 
        a.typeID - b.typeID)),
        shareReplay(1)
      );
    }

  private getBuyCost(typeId: number, quantity: number, buyStation: StationDetails, buyStructure: StructureDetails, shippingService: ShippingService) : Observable<ManufacturingCostEntry> {
    const stationCostObs = this.getStationBuyCost(typeId, quantity, buyStation);
    const structureCostObs = of<ManufacturingCostEntry>().pipe(startWith(null)); // this.getStructureBuyCost(typeId, quantity, buyStructure);

    const result = combineLatest([stationCostObs, structureCostObs]).pipe(
      map(([stationCost, structureCost]) => {
        
        const shipping = CalculateShippingCostForBundle(stationCost.total_buyPrice, stationCost.total_volume, shippingService);
        const stationWithShipping = stationCost.total_buyPrice + shipping;

        // we check if the local price is cheaper
        if(structureCost != null && structureCost.enoughVolume && structureCost.total_buyPrice < stationWithShipping)
          return structureCost;

        return stationCost;
      })
    );

    return result;
  }

  private getStationBuyCost(typeId: number, quantity: number, buyStation: StationDetails): Observable<ManufacturingCostEntry> {
    return this.universeService.getItemDetails(typeId).pipe(
      switchMap(itemDetails => this.marketService.getRegionMarketForItem(itemDetails.type_id, JITA_REGION_ID).pipe(
        map(entries => entries.filter(marketEntry => marketEntry.location_id ===buyStation.station_id)),
        map(marketEntries => ({ itemDetails: itemDetails, marketEntries: marketEntries })),
        map(entry => {
          const nPrice = getPriceForN(entry.marketEntries, quantity);
          return {
            requireShipping: true,
            buyLocation: buyStation,
            quantity_total: quantity,
            typeID: entry.itemDetails.type_id,
            itemName: entry.itemDetails.name,
            single_buyPrice: nPrice.averagePrice,
            total_buyPrice: nPrice.totalPrice,
            total_volume: entry.itemDetails.packaged_volume * quantity,
            enoughVolume: nPrice.enough        
          };
        })
        )
      ),
      shareReplay(1)
    );
  }

  private getStructureBuyCost(typeId: number, quantity: number, buyStructure: StructureDetails): Observable<ManufacturingCostEntry> {
    return this.universeService.getItemDetails(typeId).pipe(
      switchMap(itemDetails => this.marketService.getStructureMarketForItem(buyStructure.evelyn_structureId, itemDetails.type_id, false).pipe(
        map(marketEntries => ({ itemDetails: itemDetails, marketEntries: marketEntries })),
        map(entry => {
          const nPrice = getPriceForN(entry.marketEntries, quantity);
          return {
            requireShipping: false,
            buyLocation: buyStructure,
            quantity_total: quantity,
            typeID: entry.itemDetails.type_id,
            itemName: entry.itemDetails.name,
            single_buyPrice: nPrice.averagePrice,
            total_buyPrice: nPrice.totalPrice,
            total_volume: entry.itemDetails.packaged_volume * quantity,
            enoughVolume: nPrice.enough
          };
        })
        )
      ),
      shareReplay(1)
    );
  }
}
