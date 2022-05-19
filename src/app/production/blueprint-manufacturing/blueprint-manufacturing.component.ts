import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, filter, forkJoin, from, map, mergeMap, Observable, of, shareReplay, switchMap, take, tap, toArray } from 'rxjs';
import { BlueprintDetails, ItemDetails, MarketEntry, Material, StationDetails } from 'src/app/models';
import { EvepraisalDataRepositoryService } from 'src/app/repositories/evepraisal-data-repository.service';
import { calculateMaterialQuantity, copyToClipboard, getPriceForN, IndustryService, ItemIdentifier, JITA_REGION_ID, MarketService, UniverseService } from 'src/app/shared';
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
      map(materials => {
        const items: Observable<{ material: Material, item: ItemDetails }>[] = [];
        materials.forEach(material => {
          items.push(this.universeService.getItemDetails(material.typeID).pipe(
            map(item => ({material, item}))))
        });
        return items;
      }),
        mergeMap(items => forkJoin(items)),
        map(itemDetails => itemDetails),
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
          toArray(),
          map(entries => entries.sort((a, b) => 
          a.component.item.type_id > b.component.item.type_id ? -1 : 1))
        )
      ),
    );


    this.subBPOsManufacturingCostsObs = combineLatest([this.runs$, this.subBPOsObs, this.buyStation$, this.meLevel$]).pipe(
      mergeMap(([runs, subBPOs, buyStation, meLevel]) =>
        from(subBPOs).pipe(
          mergeMap(input => {
            console.log("products: ", input.component.item.name);
              let subComponentRuns = 1;
              const reqSingleRunAmount = calculateMaterialQuantity(input.component.material.quantity, meLevel);
              console.log("reqSingleRunAmount: ", reqSingleRunAmount);
              const reqAllRunsAmount = reqSingleRunAmount * runs;
              console.log("reqAllRunsAmount: ", reqAllRunsAmount);

              const product = input.bpo.activities.manufacturing.products.find(p => p.typeID == input.component.material.typeID);
              let overflow = 0;

              if(product) {
                let missingAmount = reqAllRunsAmount - product.quantity;

                while(missingAmount > 0) {
                  subComponentRuns++;
                  missingAmount -= product.quantity;
                }

                const overflow = Math.abs(missingAmount);
                console.log("products: ", input.component.item.name, subComponentRuns, overflow);
              }

              const result = this.getBPOCalculation(of(subComponentRuns), of(input.bpo), of(buyStation), of(meLevel)).pipe(
              take(1),
              map(calc => ({ item: input.component.item, bpoCost: calc, overflow: overflow })));
              return result;
          }),
          filter(x => !!x && x.bpoCost && x.bpoCost.length > 0),
          toArray(),  
          map(entries => entries.sort((a, b) => 
          a.item.type_id > b.item.type_id ? -1 : 1))
        )));

    this.manufacturingCostsObs = this.getBPOCalculation(this.runs$, this.mainBPODetailsObs, this.buyStation$, this.meLevel$);
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
        map(entry => {
          const itemDetails: Observable<{runs: number, itemDetails: ItemDetails, material: Material, marketEntries: MarketEntry[] }>[] = [];
          entry.materials.forEach(material => {
  
            var materialCopy: Material = { typeID: material.typeID, quantity: material.quantity }
            materialCopy.quantity = calculateMaterialQuantity(materialCopy.quantity, entry.meLevel);
            
            const itemData = this.universeService.getItemDetails(material.typeID).pipe(
              switchMap(itemDetails => {
                return this.marketService.getRegionMarketForItem(itemDetails.type_id, JITA_REGION_ID).pipe(
                 map(entries => entries.filter(marketEntry => marketEntry.location_id === entry.buyStation.station_id)),
                 map(marketEntries => ({ runs: entry.runs, itemDetails: itemDetails, material: materialCopy, marketEntries: marketEntries }))); 
              }
              ));
  
            itemDetails.push(itemData);
          }); 
          return itemDetails;    
        }),
        switchMap(obs => forkJoin(obs)),
        map(entries => {
          const result: ManufacturingCostEntry[] = [];
          entries.forEach(entry =>  {
            const nPrice = getPriceForN(entry.marketEntries, entry.material.quantity);
            
            result.push({
              quantity: entry.material.quantity,
              quantity_total: entry.material.quantity * entry.runs,
              typeID: entry.itemDetails.type_id,
              itemName: entry.itemDetails.name,
              single_buyPrice: nPrice.averagePrice,
              total_buyPrice: nPrice.totalPrice
            })
          });
          return result;
        }))
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
