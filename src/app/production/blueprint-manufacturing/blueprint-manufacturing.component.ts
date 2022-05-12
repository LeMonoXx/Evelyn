import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, filter, first, forkJoin, from, map, mergeMap, Observable, ObservableNotification, of, shareReplay, startWith, switchMap, take, tap, toArray, zip } from 'rxjs';
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
  public subComponentsObs: Observable<ItemDetails[]>;
  public subBPOsObs: Observable<BlueprintDetails[]>;
  public subBPOsManufacturingCostsObs: Observable<ManufacturingCostEntry[][]>;

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
        const items: Observable<ItemDetails>[] = [];
        materials.forEach(material => {
          items.push(this.universeService.getItemDetails(material.typeID))
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
          mergeMap(component => this.autoCompleteService.getAutoCompleteSuggestions(component.name + " Blueprint").pipe(
            filter(x => !!x && x.length > 0),
            map(items => items[0]),
            tap(item => console.log(item.name)),
            mergeMap(item => this.industryService.getBlueprintDetails(item.id))
          )),
          toArray()
        )
      )
    );

   this.subBPOsManufacturingCostsObs = this.subBPOsObs.pipe(
      mergeMap(bpos =>
        from(bpos).pipe(
          mergeMap(bpo => this.getBPOCalculation(this.runs$, of(bpo), this.buyStation$, this.meLevel$)),
          toArray()
        ))
    )

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
            // only materials with a quantity above 1 will be affected by material-efficiency
            if (material.quantity > 1) {
              materialCopy.quantity = calculateMaterialQuantity(materialCopy.quantity, entry.meLevel);
            }
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
