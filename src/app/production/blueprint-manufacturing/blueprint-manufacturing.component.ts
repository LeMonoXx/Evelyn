import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, filter, forkJoin, from, map, mergeMap, Observable, of, shareReplay, switchMap, take, tap, toArray } from 'rxjs';
import { BlueprintDetails, ItemDetails, MarketEntry, Material, StationDetails } from 'src/app/models';
import { EvepraisalDataRepositoryService } from 'src/app/repositories/evepraisal-data-repository.service';
import { calculateMaterialQuantity, calculateRequiredRuns, copyToClipboard, getPriceForN, IndustryService, ItemIdentifier, JITA_REGION_ID, MarketService, UniverseService } from 'src/app/shared';
import { ManufacturingCostEntry } from '..';

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
  public manufacturingCostsObs: Observable<ManufacturingCostEntry[]>;
  public subComponentsObs: Observable<{ material: Material, item: ItemDetails }[]>;
  public subBPOsObs: Observable<{ component: { material: Material, item: ItemDetails }, bpo: BlueprintDetails; }[]>;
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
          mergeMap(component => this.autoCompleteService.getAutoCompleteSuggestions(component.item.name + " Blueprint").pipe(
            filter(x => !!x && x.length > 0),
            map(items => items[0]),
            mergeMap(item => this.industryService.getBlueprintDetails(item.id).pipe(
              map(bpo => ({ component: component, bpo: bpo }))
            ))
          )),
          toArray()
        )
      ),
    );


    this.subBPOsManufacturingCostsObs = combineLatest([this.runs$, this.subBPOsObs, this.buyStation$, this.meLevel$]).pipe(
      mergeMap(([runs, subBPOs, buyStation, meLevel]) =>
        from(subBPOs).pipe(
          mergeMap(input => {
              const reqSingleRunAmount = calculateMaterialQuantity(input.component.material.quantity, meLevel);
              const reqAllRunsAmount = reqSingleRunAmount * runs;
              const subComponentRuns = calculateRequiredRuns(input.component.material.typeID, reqAllRunsAmount, input.bpo);

              const result = this.getBPOCalculation(of(subComponentRuns.reqRuns), of(input.bpo), of(buyStation), of(meLevel)).pipe(
              take(1),
              map(calc => ({ item: input.component.item, bpoCost: calc, overflow: subComponentRuns.overflow })));
              return result;
          }),
          filter(x => !!x && x.bpoCost && x.bpoCost.length > 0),
          toArray(),  
          map(entries => entries.sort((a, b) => 
          a.item.type_id - b.item.type_id))
        )));

   // this.manufacturingCostsObs = this.getBPOCalculation(this.runs$, this.mainBPODetailsObs, this.buyStation$, this.meLevel$);
  }

  private getBPOCalculation(
    runs$: Observable<number>, 
    bpo$: Observable<BlueprintDetails>,
    buyStation$: Observable<StationDetails>,
    meLevel$: Observable<number>)
    : Observable<ManufacturingCostEntry[]> {
      return combineLatest([runs$, bpo$, buyStation$, meLevel$]).pipe(
        map(([runs, bpo, buyStation, meLevel]) => 
          ({runs: runs, materials: bpo.activities.manufacturing.materials, buyStation: buyStation, meLevel: meLevel })),
          mergeMap(input =>
            from(input.materials).pipe(
              mergeMap(material => {
                var materialCopy: Material = { typeID: material.typeID, quantity: material.quantity };
                materialCopy.quantity = calculateMaterialQuantity(materialCopy.quantity, input.meLevel);

                return this.universeService.getItemDetails(material.typeID).pipe(
                  switchMap(itemDetails => this.marketService.getRegionMarketForItem(itemDetails.type_id, JITA_REGION_ID).pipe(
                    map(entries => entries.filter(marketEntry => marketEntry.location_id === input.buyStation.station_id)),
                    map(marketEntries => ({ runs: input.runs, itemDetails: itemDetails, material: materialCopy, marketEntries: marketEntries })),
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
              }),
              toArray(), 
              map(entries => entries.sort((a, b) => 
              a.typeID - b.typeID))
            )
          ));
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
