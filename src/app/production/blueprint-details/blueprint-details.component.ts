import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, debounceTime, filter, map, mergeMap, Observable, switchMap, tap } from 'rxjs';
import { BlueprintDetails, ItemDetails, MarketEntry, StructureDetails } from 'src/app/models';
import { CalculateShippingCostForBundle, calculateTotalCosts, calculateTotalVolume, copyToClipboard, MarketService, UniverseService } from 'src/app/shared';
import { ManufacturingCalculation } from '..';

@Component({
  selector: 'app-blueprint-details',
  templateUrl: './blueprint-details.component.html',
  styleUrls: ['./blueprint-details.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlueprintDetailsComponent implements OnInit {

  @Input() 
  public runs$: Observable<number>;

  @Input()
  public BPOItem$: Observable<ItemDetails>;

  @Input()
  public BPODetails$: Observable<BlueprintDetails>;

  @Input()
  public subBPOsManufacturingCosts$: Observable<ManufacturingCalculation[]>;

  @Input()
  public saleTaxPercent$: Observable<number>;

  @Input()
  public sellStructure$: Observable<StructureDetails>;
  
  public currentItemImageSourceObs: Observable<string>;
  public productObs: Observable<{ product: ItemDetails, amount: number, imageSource: string }>;
  public totalMaterialCostsObs: Observable<number>;
  public totalVolumeObs: Observable<number>;
  public shippingCostsObs: Observable<number>;
  public lowestSellEntryObs: Observable<MarketEntry>;
  public sellDataObs: Observable<{ 
    single_sellPrice: number; 
    total_sellPrice: number; 
    brokerFee: number; 
    saleTax: number; 
    profit: number; 
  }>;
  
  constructor(
    private universeService: UniverseService,
    private marketService: MarketService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    
    this.currentItemImageSourceObs = this.BPOItem$.pipe(
      map(item => {
        return this.universeService.getImageUrlForType(item.type_id, 64);
      }));

      this.productObs = this.BPODetails$.pipe(
        switchMap(bpo => this.universeService.getItemDetails(bpo.activities.manufacturing.products[0].typeID).pipe(
          map(item => ({ 
            product: item,
            amount: bpo.activities.manufacturing.products[0].quantity,
            imageSource: this.universeService.getImageUrlForType(item.type_id, 64) 
          }))
        ))
      )

      this.totalMaterialCostsObs = this.subBPOsManufacturingCosts$.pipe(
        map(entries => calculateTotalCosts(entries))); 

      this.totalVolumeObs = this.subBPOsManufacturingCosts$.pipe(
        map(entries => calculateTotalVolume(entries))
      )

      this.shippingCostsObs = combineLatest([this.totalMaterialCostsObs, this.totalVolumeObs]).pipe(
        map(([price, volume]) => CalculateShippingCostForBundle(price, volume))
      )

      this.lowestSellEntryObs = combineLatest([this.sellStructure$, this.productObs]).pipe(
        debounceTime(100),
        mergeMap(([sellStructure, product]) =>  
          this.marketService.getStructureMarketForItem(sellStructure.evelyn_structureId, product.product.type_id, false).pipe(
            filter(e => !!e && e.length > 0),
            map(entries => entries[0])
          )
        ));

      this.sellDataObs = 
      combineLatest(
        [
          this.productObs, 
          this.runs$,
          this.totalMaterialCostsObs, 
          this.lowestSellEntryObs,
          this.saleTaxPercent$
        ]).pipe(
          map((
            [
              productObs,
              runs,
              totalMaterialCosts, 
              lowestSellEntry,  
              saleTaxPercent
            ]) => {
              const sellAmout = productObs.amount * runs;
              const sellPriceForX = lowestSellEntry.price * sellAmout;

              const brokerFee =  sellPriceForX / 100 * 2.5;
  
              const saleTax = sellPriceForX / 100 * saleTaxPercent;
              const profit = ((sellPriceForX - totalMaterialCosts) - brokerFee);

              const sellCalculation: { single_sellPrice: number, total_sellPrice: number, brokerFee: number, saleTax: number, profit: number } = 
              { 
                single_sellPrice: lowestSellEntry.price,
                total_sellPrice: sellPriceForX,
                brokerFee: brokerFee,
                saleTax: saleTax,
                profit: profit
              };

              return sellCalculation;
            }));
  }
  
  public copy(text: string | number) {
    copyToClipboard(text as string);

    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
}
