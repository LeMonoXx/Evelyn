import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, debounceTime, filter, map, mergeMap, Observable, shareReplay, switchMap } from 'rxjs';
import { BlueprintDetails, ItemDetails, MarketEntry, StructureDetails } from 'src/app/models';
import { calculateComponentMaterialCosts, calculateComponentShippingColaterial, calculateComponentVolume, CalculateShippingCostForBundle, copyToClipboard, MarketService, ShippingService, UniverseService } from 'src/app/shared';
import { ManufacturingCostEntry, SubComponent } from '..';

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
  public mainBpoJobCost$: Observable<number>;
  @Input()
  public manufacturingCosts$: Observable<ManufacturingCostEntry[]>;
  @Input()
  public subComponents$: Observable<SubComponent[]>;
  @Input()
  public saleTaxPercent$: Observable<number>;
  @Input()
  public sellStructure$: Observable<StructureDetails>;
  @Input()
  public shippingService$: Observable<ShippingService>;
  
  public currentItemImageSourceObs: Observable<string>;
  public productObs: Observable<{ product: ItemDetails, amount: number, imageSource: string }>;
  public totalMaterialCostsObs: Observable<number>;
  public totalVolumeObs: Observable<number>;
  public ShippingColateralObs: Observable<number>;
  public ShippingVolumeObs: Observable<number>;
  public shippingCostObs: Observable<number>;
  public sellEntriesObs: Observable<MarketEntry[]>;
  public sellDataObs: Observable<{ 
    bpo: BlueprintDetails,
    volume: number,
    shippingVolume: number
    shippingColateral: number
    shippingCost: number,
    materialCost: number,
    mainBpoJobCost: number,
    subComponentsJobCost: number,
    single_sellPrice: number, 
    artificialSellPrice: boolean,
    total_sellPrice: number,
    brokerFee: number,
    saleTax: number,
    profit: number }>;

  private subComponentsJobCostObs: Observable<number>;

  constructor(
    private universeService: UniverseService,
    private marketService: MarketService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    
    this.currentItemImageSourceObs = this.BPOItem$.pipe(
      map(item => {
        return this.universeService.getImageUrlForType(item.type_id, 64);
      }),
      shareReplay(1));

      this.productObs = this.BPODetails$.pipe(
        filter(x => !!x),
        switchMap(bpo => this.universeService.getItemDetails(bpo.activities.manufacturing.products[0].typeID).pipe(
          map(item => ({ 
            product: item,
            amount: bpo.activities.manufacturing.products[0].quantity,
            imageSource: this.universeService.getImageUrlForType(item.type_id, 64) 
          }))
        )),
        shareReplay(1)
      )

      this.totalMaterialCostsObs = this.manufacturingCosts$.pipe(
        map(entries => calculateComponentMaterialCosts(entries)),
        shareReplay(1)); 

      this.totalVolumeObs = this.manufacturingCosts$.pipe(
        map(entries => calculateComponentMaterialCosts(entries)),
        shareReplay(1)
      )

      this.ShippingColateralObs = this.manufacturingCosts$.pipe(
        map(entries => calculateComponentShippingColaterial(entries)),
        shareReplay(1)); 

      this.ShippingVolumeObs = this.manufacturingCosts$.pipe(
        map(entries => calculateComponentVolume(entries)),
        shareReplay(1)
      )

      this.shippingCostObs = combineLatest([this.ShippingColateralObs, this.ShippingVolumeObs, this.shippingService$]).pipe(
        map(([price, volume, shippingService]) => CalculateShippingCostForBundle(price, volume, shippingService)),
        shareReplay(1)
      )

      this.subComponentsJobCostObs = this.subComponents$.pipe(
        map(subComponents => {
          let total = 0;
          subComponents.forEach(entry => {
            if(entry.jobCost)
              total += entry.jobCost
          });
          return total;
        })
      );


      this.sellEntriesObs = combineLatest([this.sellStructure$, this.productObs]).pipe(
        debounceTime(50),
        mergeMap(([sellStructure, product]) =>  
          this.marketService.getStructureMarketForItem(sellStructure.evelyn_structureId, product.product.type_id, false)
        ),
        shareReplay(1));

      this.sellDataObs = 
      combineLatest(
        [
          this.BPODetails$,
          this.totalVolumeObs,
          this.ShippingVolumeObs,
          this.ShippingColateralObs,
          this.shippingCostObs,
          this.mainBpoJobCost$,
          this.subComponentsJobCostObs,
          this.productObs, 
          this.runs$,
          this.totalMaterialCostsObs, 
          this.sellEntriesObs,
          this.saleTaxPercent$
        ]).pipe(
          map((
            [
              bpo,
              totalVolume,
              shippingVolume,
              shippingColateral,
              shippingCost,
              mainBpoJobCost,
              subComponentsJobCost,
              productObs,
              runs,
              totalMaterialCosts, 
              sellEntries,  
              saleTaxPercent
            ]) => {
              const sellAmout = productObs.amount * runs;
              let sellPrice = 0;
              let artificialSellPrice = false;

              if(sellEntries && sellEntries.length > 0) {
                sellPrice = sellEntries[0].price;
              } else {
                artificialSellPrice = true;
                let artificialPrice = (totalMaterialCosts + shippingCost) / sellAmout;
                artificialPrice = artificialPrice + (artificialPrice / 100 * 20)

                sellPrice = artificialPrice;
              }


              const sellPriceForX = sellPrice * sellAmout;

              const brokerFee =  sellPriceForX / 100 * 2.5;
  
              const saleTax = sellPriceForX / 100 * saleTaxPercent;
              const profit = (((((sellPriceForX - totalMaterialCosts) - brokerFee) - saleTax) - shippingCost) - mainBpoJobCost) - subComponentsJobCost;

              const sellCalculation: { 
                bpo: BlueprintDetails,
                volume: number,
                shippingVolume: number
                shippingColateral: number
                shippingCost: number,
                materialCost: number,
                mainBpoJobCost: number,
                subComponentsJobCost: number,
                single_sellPrice: number, 
                artificialSellPrice: boolean,
                total_sellPrice: number,
                brokerFee: number,
                saleTax: number,
                profit: number } = 
              { 
                bpo: bpo,
                volume: totalVolume,
                shippingVolume: shippingVolume,
                shippingColateral: shippingColateral,
                shippingCost: shippingCost,
                materialCost: totalMaterialCosts,
                mainBpoJobCost: mainBpoJobCost,
                subComponentsJobCost: subComponentsJobCost,
                single_sellPrice: sellPrice,
                artificialSellPrice: artificialSellPrice,
                total_sellPrice: sellPriceForX,
                brokerFee: brokerFee,
                saleTax: saleTax,
                profit: profit
              };

              return sellCalculation;
            }),
            shareReplay(1));
  }
  
  public copy(text: string | number) {
    copyToClipboard(text as string);

    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
}
