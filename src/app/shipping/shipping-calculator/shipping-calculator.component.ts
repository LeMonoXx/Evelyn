import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, debounceTime, map, Observable, switchMap, forkJoin, combineLatest, from, toArray, shareReplay, distinctUntilChanged, tap } from 'rxjs';
import { ItemDetails } from 'src/app/models';
import { EveMarketerDataRepositoryService } from 'src/app/repositories';
import { ItemSearchService, CharacterService, UniverseService, InputErrorStateMatcher, copyToClipboard, MarketService, getPriceForN, CalculateShippingCost, CalculateShippingCostForBundle, ShippingService } from 'src/app/shared';

@Component({
  selector: 'app-shipping-calculator',
  templateUrl: './shipping-calculator.component.html',
  styleUrls: ['./shipping-calculator.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ShippingCalculatorComponent implements OnInit {

  public shippingCalcGroup: FormGroup;
  public itemListControl = new FormControl(null, [Validators.minLength(3), Validators.required]);
  public matcher: InputErrorStateMatcher;
  public itemsObs: Observable<{ item: ItemDetails; count: number; }[]>;
  public calculationResultObs: Observable<{ item: ItemDetails; count: number; singlePrice: number; totalPrice: number; singlequbicMeters: number; qubicMeters: number; shippingPrice: number; }[]>;
  public collateralObs: Observable<number>;
  public shippingServiceObs: Observable<ShippingService>;
  public shippingPriceObs: Observable<number>;
  public totalVolumeObs: Observable<number>;

  constructor(
    fb: FormBuilder,
    private itemSearchService: ItemSearchService,
    private characterService: CharacterService,
    private universeService: UniverseService,
    private autoCompleteService : EveMarketerDataRepositoryService,
    private marketService: MarketService,
    private snackBar: MatSnackBar) { 

    this.shippingCalcGroup = fb.group({
      itemName: this.itemListControl
    });

    this.matcher = new InputErrorStateMatcher();
  }

  ngOnInit(): void {

    this.shippingServiceObs = this.itemSearchService.ShippingServiceObs;

    this.itemsObs = this.itemListControl.valueChanges.pipe(
      filter((value: string) => value?.trim().length > 2),
      debounceTime(50),
      map((value: string) => {
        const result: Observable<{ item: ItemDetails, count: number }>[] = [];      
        var lines = value.split("\n");
        lines.forEach(line => {
          const itemArray = line.split("\t");
          const itemName = itemArray[0];

          if (itemArray.length > 0 && itemName.length > 0) {
            let countStr = itemArray.length > 1 ? itemArray[1].trim() === "" ? "1" : itemArray[1].trim() : "1";
            const count = parseInt(countStr);
            const itemObs = this.universeService.findItemByName(itemName).pipe(
              filter(x => !!x && x.inventory_type && x.inventory_type.length > 0),
              map(item => item.inventory_type[0]),
              switchMap(typeId => this.universeService.getItemDetails(typeId).pipe(
                map(item => ({ item: item, count: count }))
            )));
            result.push(itemObs);
          }
        })
        return result;
      }),
      switchMap(values => forkJoin(values)),
      tap(e => console.log("length: ", e.length)),
      shareReplay(1),
      distinctUntilChanged());

      this.calculationResultObs = combineLatest([this.itemsObs, this.itemSearchService.BuyStationObs, this.shippingServiceObs]).pipe(
        map(([items, buyStation, shippingService]) => {
          const result: Observable<{ 
            item: ItemDetails, 
            count: number, 
            singlePrice: number, 
            totalPrice: number, 
            singlequbicMeters: number,
            qubicMeters: number,
            shippingPrice: number
          }>[] = [];
          items.forEach(value => {
            const curObs = this.marketService.getRegionMarketForItem(value.item.type_id).pipe(
              filter(x => !!x && x.length > 0),
              // we get the market for the whole region. But we only want given buy-station.
              map(entries => entries.filter(entry => entry.location_id === buyStation.station_id)),
              map(buyEntries => {
                const singlePrice = getPriceForN(buyEntries, 1).averagePrice;
                const totalPrice = getPriceForN(buyEntries, value.count).totalPrice;

                const singlequbicMeters = value.item.packaged_volume
                const qubicMeters = value.item.packaged_volume * value.count;

                const shippingPrice = CalculateShippingCost(singlePrice, singlequbicMeters, value.count, shippingService);
                console.log("item: ", value.item.name, totalPrice);
                return ({ 
                  item: value.item, 
                  count: value.count, 
                  singlePrice: singlePrice, 
                  totalPrice: totalPrice, 
                  singlequbicMeters: singlequbicMeters,
                  qubicMeters: qubicMeters,
                  shippingPrice: shippingPrice
                });
              })
            );

            result.push(curObs);
          })
          return result;
        }),
        switchMap(obs => forkJoin(obs)),
        shareReplay(1),
        distinctUntilChanged()
      );

      this.collateralObs = this.calculationResultObs.pipe(
        map(entries => {
          let totalCosts = 0;
          entries.forEach(entry => totalCosts+= entry.totalPrice);
          return totalCosts;
        }),
        shareReplay(1)
      );  
      
      this.shippingPriceObs = this.calculationResultObs.pipe(
        map(entries => {
          let totalCosts = 0;
          entries.forEach(entry => totalCosts+= entry.shippingPrice);
          return totalCosts;
        }),
        shareReplay(1)
      );

      this.totalVolumeObs = this.calculationResultObs.pipe(
        map(entries => {
          let totalVolume = 0;
          entries.forEach(entry => totalVolume+= entry.qubicMeters);
          return totalVolume;
        }),
        shareReplay(1)
      );
  }

  public copy(text: string | number) {
    copyToClipboard(text as string);
    
    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
  
  public getImageForItem(typeId: number | undefined): string {
    if(!typeId)
    return "";

    return this.universeService.getImageUrlForType(typeId, 32);
  }

}
