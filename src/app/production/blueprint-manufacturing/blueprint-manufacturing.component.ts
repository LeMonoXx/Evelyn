import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, filter, forkJoin, from, map, mergeMap, Observable, of, shareReplay, startWith, switchMap, take, tap, toArray } from 'rxjs';
import { BlueprintDetails, ItemDetails, MarketEntry, Material, StationDetails } from 'src/app/models';
import { EvepraisalDataRepositoryService } from 'src/app/repositories/evepraisal-data-repository.service';
import { calculateMaterialQuantity, calculateRequiredRuns, copyToClipboard, getPriceForN, IndustryService, ItemIdentifier, JITA_REGION_ID, MarketService, UniverseService } from 'src/app/shared';
import { ManufacturingCostEntry, SubComponent } from '..';

@Component({
  selector: 'app-blueprint-manufacturing',
  templateUrl: './blueprint-manufacturing.component.html',
  styleUrls: ['./blueprint-manufacturing.component.scss']
})
export class BlueprintManufacturingComponent implements OnInit {

  @Input()
  public item$: Observable<ItemIdentifier>;
  @Input()
  public buyStation$: Observable<StationDetails>;
  @Input()
  public runs$: Observable<number> = new BehaviorSubject(1);
  @Input()
  public meLevel$: Observable<number>;
  @Input()
  public teLevel$: Observable<number>;


  public mainBPODetailsObs: Observable<BlueprintDetails>;
  public subComponentsObs: Observable<SubComponent[]>;
  public subBPOsObs: Observable<{ component: SubComponent, bpo?: BlueprintDetails; }[]>;
  public subBPOsManufacturingCostsObs: Observable<{ item: ItemDetails, bpoCost: ManufacturingCostEntry[]; }[]>;

  constructor(
    private industryService: IndustryService,
    private universeService: UniverseService,
    private marketService: MarketService,
    private snackBar: MatSnackBar,
    private autoCompleteService : EvepraisalDataRepositoryService) { }

  public ngOnInit(): void { 
    this.mainBPODetailsObs = this.item$.pipe(
      switchMap(item => this.industryService.getBlueprintDetails(item.id)),
      shareReplay(1)
    );

    this.subComponentsObs = this.mainBPODetailsObs.pipe(
      map(details => details.activities.manufacturing.materials),
      mergeMap(materials =>
        from(materials).pipe(
          mergeMap(material => this.universeService.getItemDetails(material.typeID).pipe(
            map(item => ({material, item}))
            )
          ),
          toArray()
        )),
      shareReplay(1)
      );

    this.subBPOsObs = this.subComponentsObs.pipe(
      mergeMap(components => 
        from(components).pipe(
         // filter(c => c.item.type_id !== 17478),
          mergeMap(component => this.autoCompleteService.getAutoCompleteSuggestions(component.item.name + " Blueprint").pipe(
            filter(x => !!x && x.length > 0),
            map(items => items[0]),
            mergeMap(item => this.industryService.getBlueprintDetails(item.id).pipe(
              map(bpo => ({ component: component, bpo: bpo }))
            ))
          )),
          toArray(),
        ),
      ),
    );

    const allRequiredComponents = combineLatest([this.runs$, this.subComponentsObs, this.subBPOsObs, this.buyStation$, this.meLevel$]).pipe(
      map(([runs, subComponents, subBPOs, buyStation, meLevel]) => {
        subComponents.forEach(component => {
          const exists = subBPOs.some(entry => entry.component.item.type_id === component.material.typeID);
          if(!exists) {
            subBPOs.push(({ component: component, bpo: undefined }))
          }
        })

        return ({ runs, subComponents, subBPOs, buyStation, meLevel });
      }
    ));


    this.subBPOsManufacturingCostsObs = allRequiredComponents.pipe(
        mergeMap(allReqComp =>
        from(allReqComp.subBPOs).pipe(
          mergeMap(input => {
            if(input.bpo) {
              const reqSingleRunAmount = calculateMaterialQuantity(input.component.material.quantity, allReqComp.meLevel);
              const reqAllRunsAmount = reqSingleRunAmount * allReqComp.runs;
              const subComponentRuns = calculateRequiredRuns(input.component.material.typeID, reqAllRunsAmount, input.bpo);

              return this.getBPOCalculation(
                                of(subComponentRuns.reqRuns), 
                                of(input.bpo.activities.manufacturing.materials), 
                                of(allReqComp.buyStation), 
                                of(allReqComp.meLevel)).pipe(
              take(1),
              map(calc => ({ item: input.component.item, bpoCost: calc, overflow: subComponentRuns.overflow })));
            } else {
              var materialCopy: Material = { typeID: input.component.material.typeID, quantity: input.component.material.quantity };
              materialCopy.quantity = calculateMaterialQuantity(materialCopy.quantity, allReqComp.meLevel);
              return this.getManufacturingCost(allReqComp.runs, materialCopy, allReqComp.buyStation).pipe(
                map(c => [c]),
                map(calc => ({ item: input.component.item, bpoCost: calc, overflow: 0 }))
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
    runs$: Observable<number>, 
    materials$: Observable<Material[]>,
    buyStation$: Observable<StationDetails>,
    meLevel$: Observable<number>)
    : Observable<ManufacturingCostEntry[]> {
      return combineLatest([runs$, materials$, buyStation$, meLevel$]).pipe(
        map(([runs, materials, buyStation, meLevel]) => 
          ({runs: runs, materials: materials, buyStation: buyStation, meLevel: meLevel })),
          mergeMap(input =>
            from(input.materials).pipe(
              mergeMap(material => {
                var materialCopy: Material = { typeID: material.typeID, quantity: material.quantity };
                materialCopy.quantity = calculateMaterialQuantity(materialCopy.quantity, input.meLevel);

                return this.getManufacturingCost(input.runs, materialCopy, input.buyStation);
              }),
              toArray(), 
              map(entries => entries.sort((a, b) => 
              a.typeID - b.typeID))
            )
          ));
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

  public calcCostSum(entries: ManufacturingCostEntry[]) {
    const result = entries.reduce((accumulator, current) => {
      return accumulator + current.total_buyPrice;
    }, 0);
    return result;
  }
  
  public copy(text: string) {
    copyToClipboard(text);
    
    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
  
  public getImageForItem(typeId: number): string {
    return this.universeService.getImageUrlForType(typeId, 32);
  }

}
