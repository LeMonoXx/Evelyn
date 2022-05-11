import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, forkJoin, map, mergeMap, Observable, ObservableNotification, switchMap, zip } from 'rxjs';
import { BlueprintDetails, ItemDetails, MarketEntry, Material, StationDetails } from 'src/app/models';
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
  constructor(
    private industryService: IndustryService,
    private universeService: UniverseService,
    private marketService: MarketService,
    private snackBar: MatSnackBar) { }

  public ngOnInit(): void { 
    this.mainBPODetailsObs = this.item$.pipe(
      switchMap(item => this.industryService.getBlueprintDetails(item.id))
    );

    this.mainBPODetailsObs.pipe(
      map(details => details.activities.manufacturing.materials),
      map(materials => {
        const items: Observable<ItemDetails>[] = [];
        materials.forEach(material => {
          items.push(this.universeService.getItemDetails(material.typeID))
        });
        return items;
      }),
        mergeMap(items => forkJoin(items)),
        map(itemDetails => )
        );

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
