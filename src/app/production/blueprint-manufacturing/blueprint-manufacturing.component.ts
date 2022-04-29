import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, forkJoin, map, Observable, switchMap } from 'rxjs';
import { BlueprintDetails, ItemDetails, MarketEntry, Material, StationDetails } from 'src/app/models';
import { copyToClipboard, getPriceForN, IndustryService, ItemIdentifier, JITA_REGION_ID, MarketService, UniverseService } from 'src/app/shared';
import { ManufacturingCostEntry } from '..';
import { ProductionSettingsService } from '../services/production-settings.service';

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


  public BpoDetailsObs: Observable<BlueprintDetails>;
  public manufacturingCostsObs: Observable<ManufacturingCostEntry[]>;
  constructor(
    private industryService: IndustryService,
    private universeService: UniverseService,
    private marketService: MarketService,
    private snackBar: MatSnackBar) { }

  public ngOnInit(): void { 
    this.BpoDetailsObs = this.item$.pipe(
      switchMap(item => this.industryService.getBlueprintDetails(item.id))
    );

    this.manufacturingCostsObs = combineLatest([this.runs$, this.BpoDetailsObs, this.buyStation$]).pipe(
      map(([runs, bpo, buyStation]) => ({runs: runs, materials: bpo.activities.manufacturing.materials, buyStation: buyStation })),
      map(entry => {
        const itemDetails: Observable<{runs: number, itemDetails: ItemDetails, material: Material, marketEntries: MarketEntry[] }>[] = [];
        entry.materials.forEach(material => {

          const itemData = this.universeService.getItemDetails(material.typeID).pipe(
            switchMap(itemDetails => {
              return this.marketService.getRegionMarketForItem(itemDetails.type_id, JITA_REGION_ID).pipe(
               map(entries => entries.filter(marketEntry => marketEntry.location_id === entry.buyStation.station_id)),
               map(marketEntries => ({ runs: entry.runs, itemDetails: itemDetails, material: material, marketEntries: marketEntries }))); 
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
