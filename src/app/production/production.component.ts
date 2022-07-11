import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, forkJoin, from, 
  map, mergeMap, Observable, of, shareReplay, Subject, switchMap, tap, toArray } from 'rxjs';
import { IAuthResponseData, AuthService } from '../auth';
import { StructureDetails, ItemDetails, StationDetails, BlueprintDetails, Prices } from '../models';
import { EvepraisalDataRepositoryService } from '../repositories/evepraisal-data-repository.service';
import { BuyMode, calculateJobCost, calculateMaterialQuantity, calculateRequiredRuns, CalculateShippingCostForBundle, 
  calculateTaxPercentBySkillLevel, getPriceForN, getRigMEforItem, IndustryService, ItemIdentifier, 
  ItemSearchService, JITA_REGION_ID, MarketService, MJ5F9_REGION_ID, ShippingRoute, ShippingService, ShoppingEntry, ShoppingListService, UniverseService } from '../shared';
import { ManufacturingCostEntry } from './models/manufacturing-cost-entry';
import { SubComponent } from '.';
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
  public shippingRouteObs: Observable<ShippingRoute>;

  public numberCountObs: Observable<number>;
  public itemDetailsObs: Observable<ItemDetails>;
  public currentBuyStationObs: Observable<StationDetails>;
  public buyModeObs: Observable<BuyMode>;
  public authStatusObs: Observable<IAuthResponseData | null>;
  public characterSaleTaxPercentObs: Observable<number>;
  public shoppingListObs: Observable<ShoppingEntry[]>;
  public currentRegionObs: Observable<number> = new BehaviorSubject<number>(MJ5F9_REGION_ID);
  public routerItemNameSubject: Subject<string> = new BehaviorSubject("");

  public mainBPOItemObs: Observable<ItemDetails>
  public mainBPODetailsObs: Observable<BlueprintDetails>;
  public subComponentsObs: Observable<SubComponent[]>;
  public mainBpoJobCostObs: Observable<number>;

  public sellStructureSystemCostIndexObs: Observable<number>;
  public allRequiredMaterials: Observable<{ subComponent: SubComponent; reqAmount: number; subMaterials: { itemDetails: ItemDetails; quantity_total: number; }[]; }[]>;
  public manufacturingCostsObs: Observable<ManufacturingCostEntry[]>;

  public runsObs: Observable<number>;
  // me level for the main bpo
  public meLevelObs: Observable<number>;
  // me level for the sub component-bpos
  public subMeLevelObs: Observable<number>;

  public indicatorSubject = new BehaviorSubject<boolean>(false);
  public isLoadingObs = this.indicatorSubject.asObservable().pipe(distinctUntilChanged());

  private allAdjustedPrices : Observable<Prices[]>;

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
      this.shippingRouteObs = this.itemSearchService.ShippingRouteObs;
      this.runsObs = this.productionSettingsService.RunsObs;
      this.meLevelObs = this.productionSettingsService.MeLevelObs;
      this.subMeLevelObs = this.productionSettingsService.SubMeLevelObs;
      this.buyModeObs = this.productionSettingsService.BuyModeObs;

      this.allAdjustedPrices = this.marketService.getAllAdjustedPrices();
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
      shareReplay(1),
      distinctUntilChanged()
    );

    const mainBPOProductRigMeObs = this.mainBPODetailsObs.pipe(
      map(bpo => bpo.activities.manufacturing.products[0].typeID),
      switchMap(typeId => this.universeService.getItemDetails(typeId)),
      switchMap(item => this.universeService.getItemGroup(item.group_id).pipe(
        map(group => ({ item: item, group: group })),
        switchMap(value => this.universeService.getItemCategory(value.group.category_id).pipe(
          map(category => ({ item: item, category: category }))
        ))
      )),
      map(value => getRigMEforItem(value.item, value.category)),
      shareReplay(1),
      distinctUntilChanged()
    );

    this.sellStructureSystemCostIndexObs = this.currentSellStructureObs.pipe(
      switchMap(structure => this.industryService.getIndustrySystem(structure.solar_system_id)),
      map(induSystem => {
        let costIndex = 0;

        const manuIndex = induSystem.cost_indices.find(i => i.activity === "manufacturing");

        if(manuIndex) 
          costIndex = manuIndex.cost_index;

        return costIndex;
      }),
      shareReplay(1)
    );

    this.mainBpoJobCostObs = combineLatest([
      this.mainBPODetailsObs, 
      this.runsObs, 
      this.allAdjustedPrices,
      mainBPOProductRigMeObs,
      this.sellStructureSystemCostIndexObs
    ]).pipe(
      map(([bpo, runs, allPrices, mainBPOProductRigMe, systemCostIndex]) => {
        let bpoIEV = 0;
        bpo.activities.manufacturing.materials.forEach(material => {
          const itemPrice = allPrices.find(e => e.type_id === material.typeID);

          if(itemPrice)
            bpoIEV += itemPrice.adjusted_price * material.quantity;
        })

        const totalCost = calculateJobCost(bpoIEV, runs, systemCostIndex, mainBPOProductRigMe.facility);
        return totalCost;
      }),
      shareReplay(1)
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

    const subBPOsObs = combineLatest([this.runsObs, materialItemObs]).pipe(
      mergeMap(([runs, components]) => 
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
                map(bpoItem => ({ bpo: bpo, bpoItem: bpoItem })
              ),                
              switchMap(sc => this.getIEVForBPO(sc.bpo, runs).pipe(
                map(iev => ({ bpo: sc.bpo, bpoItem: sc.bpoItem, iev }))
              )),
              map(result => {
                 component.bpo = result.bpo;
                 component.IEV = result.iev;
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
      distinctUntilChanged()
    )));

    const allRequiredComponents: Observable<{ runs: number, bpoComponents: SubComponent[], buyStation: StationDetails, mainMeLevel: number, subMeLevel: number }> = 
      combineLatest([this.runsObs, materialItemObs, subBPOsObs, this.currentBuyStationObs, this.meLevelObs, this.subMeLevelObs, mainBPOProductRigMeObs, this.sellStructureSystemCostIndexObs]).pipe(
      debounceTime(100),
      map(([runs, subMaterials, subBPOs, buyStation, mainMeLevel, subMeLevel, mainBPOProductRigMe, systemCostIndex]) => {
        subMaterials.forEach(component => {
          const exists = subBPOs.some(c => c.item.type_id === component.material.typeID);
          if(!exists) {
            subBPOs.push(component);
          }
        })
        return ({ runs, bpoComponents: subBPOs, buyStation, mainMeLevel, subMeLevel, mainBPOProductRigMe, systemCostIndex });
        }
      ),
      // calculate required amount (factor in ME)
      // calculate Rig-ME production facility, if component is a BPO
      tap(allReqComp => 
        allReqComp.bpoComponents.forEach(component => {
            const reqAllRunsAmount = calculateMaterialQuantity(component.material.quantity, allReqComp.runs, allReqComp.mainMeLevel, allReqComp.mainBPOProductRigMe.modifier);
            component.requiredAmount = reqAllRunsAmount;

            if(component.bpo) {
              const subComponentRuns = calculateRequiredRuns(component.material.typeID, component.requiredAmount, component.bpo);
              component.requiredRuns = subComponentRuns.reqRuns;
              component.overflow = subComponentRuns.overflow;

              const subRigME = getRigMEforItem(component.item, component.itemCategory);
 
              component.prodFacility = subRigME.facility;

              if(component.IEV)
                component.jobCost = calculateJobCost(allReqComp.systemCostIndex, component.requiredRuns, component.IEV, subRigME.facility);
            }
          }
        ),
      ),
      shareReplay(1),
      distinctUntilChanged()
    );

    this.subComponentsObs = allRequiredComponents.pipe(     
      map(c => c.bpoComponents), 
      shareReplay(1)
    );

    this.allRequiredMaterials = allRequiredComponents.pipe(
        mergeMap(allReqComp =>
        from(allReqComp.bpoComponents).pipe(
          mergeMap(component => {
            if(component.bpo && component.requiredRuns) {  
              const subRigME = getRigMEforItem(component.item, component.itemCategory);         
               const subRuns = component.requiredRuns;
               const bpo = component.bpo;
               const amountObs = this.getSubComponentRequiredAmount(bpo, subRuns, allReqComp.subMeLevel, subRigME.modifier).pipe(
                map(subMaterials => ({ 
                        subComponent: component,
                        reqAmount: component.requiredAmount,
                        subMaterials: subMaterials 
                      })
                ));
                return amountObs;
            } else {
              const amountObs = of<({ 
                itemDetails: ItemDetails,
                quantity_total: number
              })[]>([({ itemDetails: component.item, quantity_total: component.requiredAmount })])
              .pipe(
                map(subMaterials => ({ 
                        subComponent: component,
                        reqAmount: component.requiredAmount,
                        subMaterials: subMaterials 
                      })
              ));
              return amountObs;
            }
          }),
          toArray(),
          debounceTime(40),
          map(entries => entries.sort((a, b) => 
          a.subComponent.item.type_id - b.subComponent.item.type_id)),
        )),
        shareReplay(1));

      // create flat list of item we need
      const flatMatEntriesObs = this.allRequiredMaterials.pipe(
        map(entries => {
          let itemsMap: { [typeId: number]: ({item: ItemDetails, amount: number }) } = { };

          entries.forEach(entry => {
            if(entry.subMaterials?.length > 0) {
              entry.subMaterials.forEach(subMaterial => {
                const subMaterialEntry = {item: subMaterial.itemDetails, amount: subMaterial.quantity_total }
                
                if(itemsMap[subMaterial.itemDetails.type_id] != undefined)
                {
                  // item exists, we only add the amount
                  itemsMap[subMaterial.itemDetails.type_id].amount += subMaterialEntry.amount;
                } else {
                  itemsMap[subMaterial.itemDetails.type_id] = subMaterialEntry;
                }
              });
            } else {
              const mainMaterialEntry = {item: entry.subComponent.item, amount: entry.reqAmount }
              if(itemsMap[mainMaterialEntry.item.type_id] != undefined)
              {
                // item exists, we only add the amount
                itemsMap[mainMaterialEntry.item.type_id].amount += mainMaterialEntry.amount;
              } else {
                itemsMap[mainMaterialEntry.item.type_id] = mainMaterialEntry;
              }
            }     
        });
        return itemsMap;
        }),
        map(dicEntries => Object.values(dicEntries)),        
        shareReplay(1)
      );

      this.manufacturingCostsObs = combineLatest([flatMatEntriesObs, this.currentBuyStationObs, this.currentSellStructureObs, this.shippingServiceObs, this.shippingRouteObs, this.buyModeObs]).pipe(
        debounceTime(50),
        switchMap(([flatMatEntries, buyStation, sellStructure, shippingService, route, buyMode]) => {
          const results: Observable<ManufacturingCostEntry>[] = [];
 
          flatMatEntries.forEach(flatMaterial => {
              const curObs = this.getBuyCost(flatMaterial.item.type_id, flatMaterial.amount, buyStation, sellStructure, shippingService, route, buyMode);
              results.push(curObs);
          });

          return forkJoin(results);
        }
        ),
        map(entries => entries.sort((a, b) => a.typeID - b.typeID)),        
        shareReplay(1)
      );
  }

  private getBuyCost(typeId: number, quantity: number, buyStation: StationDetails, buyStructure: StructureDetails, shippingService: ShippingService, route: ShippingRoute, buyMode: BuyMode) : Observable<ManufacturingCostEntry> {
    let stationCostObs = this.getStationBuyCost(typeId, quantity, buyStation); 
    // if want to buy only from buy-station   
    if(buyMode.id == 0)
      return stationCostObs;

    let structureCostObs = this.getStructureBuyCost(typeId, quantity, buyStructure);
    // if we want to buy only from sell-station
    if(buyMode.id == 1)
    return structureCostObs;

    // lets check the prices, and buy from the cheapest
    const result = combineLatest([stationCostObs, structureCostObs]).pipe(
      map(([stationCost, structureCost]) => {
        
        const shipping = CalculateShippingCostForBundle(stationCost.total_buyPrice, stationCost.total_volume, route);
        const stationWithShipping = stationCost.total_buyPrice + shipping;

        // we check if the local price is cheaper
        if(structureCost != null && structureCost.enoughVolume && structureCost.total_buyPrice < stationWithShipping)
          return structureCost;

        return stationCost;
      }),        
      shareReplay(1)
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

  private getSubComponentRequiredAmount(
    bpo: BlueprintDetails,
    runs: number, 
    materialEfficiency: number, 
    structureRigBonus: number): Observable<({ 
      itemDetails: ItemDetails,
      quantity_total: number
    })[]> {
      const result: Observable<({ 
        itemDetails: ItemDetails,
        quantity_total: number
      })>[] = [];
      bpo.activities.manufacturing.materials.forEach(material => {        
        const itemDetailsObs = this.universeService.getItemDetails(material.typeID).pipe(
          map(itemDetails => {
            const reqQuantity = calculateMaterialQuantity(material.quantity, runs, materialEfficiency, structureRigBonus);
            return ({ itemDetails: itemDetails, quantity_total: reqQuantity });
          })
        );

        result.push(itemDetailsObs);
      });

      return forkJoin(result).pipe(shareReplay(1));
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

  private getIEVForBPO(bpo: BlueprintDetails, runs: number): Observable<number> {
    return this.allAdjustedPrices.pipe(
      map(allPrices => {
        let totalPrice = 0;
        bpo.activities.manufacturing.materials.forEach(material => {
          const itemPrice = allPrices.find(e => e.type_id === material.typeID);

          if(itemPrice)
            totalPrice += itemPrice.adjusted_price * material.quantity;
        })
        const result = totalPrice * runs;
        return result;
      }),        
      shareReplay(1)
    );
  }
}
