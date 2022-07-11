import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, debounceTime, map, Observable, switchMap, forkJoin, combineLatest, 
  from, toArray, shareReplay, distinctUntilChanged, mergeMap, tap } from 'rxjs';
import { AuthService, IAuthResponseData } from 'src/app/auth';
import { Asset, ItemDetails } from 'src/app/models';
import { ItemSearchService, UniverseService, InputErrorStateMatcher, copyToClipboard, 
  MarketService, getPriceForN, CalculateShippingCost, ShippingService, CharacterService, getAllowedStructureIds } from 'src/app/shared';

@Component({
  selector: 'app-shipping-calculator',
  templateUrl: './shipping-calculator.component.html',
  styleUrls: ['./shipping-calculator.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ShippingCalculatorComponent implements OnInit {

  public shippingCalcGroup: UntypedFormGroup;
  public itemListControl = new UntypedFormControl(null, [Validators.minLength(3), Validators.required]);
  public matcher: InputErrorStateMatcher;
  
  public itemsObs: Observable<{ 
    order: number, 
    item: ItemDetails; 
    count: number; }[]>;

  public calculationResultObs: Observable<{ 
    order: number, 
    item: ItemDetails; 
    count: number; 
    singlePrice: number; 
    totalPrice: number; 
    singlequbicMeters: number; 
    qubicMeters: number; 
    shippingPrice: number; }[]>;

  public collateralObs: Observable<number>;
  public shippingServiceObs: Observable<ShippingService>;
  public shippingPriceObs: Observable<number>;
  public totalVolumeObs: Observable<number>;
  public authStatusObs: Observable<IAuthResponseData | null>;
  public assetsObs: Observable<Asset[]>;
  constructor(
    fb: UntypedFormBuilder,
    private authService: AuthService,
    private itemSearchService: ItemSearchService,
    private universeService: UniverseService,
    private marketService: MarketService,
    private characterService: CharacterService,
    private snackBar: MatSnackBar) { 
      this.authStatusObs = this.authService.authObs;
      
    this.shippingCalcGroup = fb.group({
      itemName: this.itemListControl
    });

    this.matcher = new InputErrorStateMatcher();
  }

  ngOnInit(): void {

    this.shippingServiceObs = this.itemSearchService.ShippingServiceObs;
    const shippingRouteObs = this.itemSearchService.ShippingRouteObs;

    this.assetsObs = this.characterService.getAuthenticatedCharacterInfo().pipe(
      tap(c => console.log(c.CharacterID)),
      switchMap(character => this.characterService.getCharacterAssets(character.CharacterID).pipe(
        map(assets => {
          const ids = getAllowedStructureIds();
          const filtered: Asset[] = []; 
           assets.forEach(a => {
            let result = true;
            ids.forEach(id => {
              if(a.location_id === id || a.location_flag !== "Hangar" || a.location_type === "station")
                result = false;
            });

            if(result)
              filtered.push(a)
          });

          return filtered;
        }),
        tap(e => console.log(e))
      )));

    this.itemsObs = this.itemListControl.valueChanges.pipe(
      debounceTime(250),
      filter((value: string) => value?.trim().length > 2),
      map((value: string) => {
        const result: Observable<{ order: number, typeId: number, itemName: string, count: number }>[] = [];      
        const lines = value.split("\n");
        let order = 1;
        lines.forEach(line => {
          const itemArray = line.split("\t");
          const itemName = itemArray[0];
          if (itemArray.length > 0 && itemName.length > 0) {
            let countStr = itemArray.length > 1 ? itemArray[1].trim() === "" ? "1" : itemArray[1].trim() : "1";

            if(countStr.includes('.'))
            countStr = countStr.replace(".","");

            const count = parseInt(countStr);

            let curOrder = order;
            const itemObs = this.universeService.findItemByName(itemName).pipe(
              map(item => ({ order: curOrder, typeId: item.inventory_type[0], itemName: itemName, count: count })));
            result.push(itemObs);
            order++;
          }
        })
        return result;
      }),
      switchMap(values => forkJoin(values)),
      map(x => x.filter(e => e.typeId > 0)),
      switchMap(entries =>
        from(entries).pipe(
          mergeMap(entry => this.universeService.getItemDetails(entry.typeId).pipe(
            map(item => ({ order: entry.order, item: item, count: entry.count }))
          ), 
          ),
          toArray())
        ),
        map(entries => entries.sort(a => a.order))
      );

      this.calculationResultObs = combineLatest([this.itemsObs, this.itemSearchService.BuyStationObs, shippingRouteObs]).pipe(
        map(([items, buyStation, shippingRoute]) => {
          const result: Observable<{ 
            order: number,
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

                const shippingPrice = CalculateShippingCost(singlePrice, singlequbicMeters, value.count, shippingRoute);
                return ({ 
                  order: value.order,
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
        map(entries => entries.sort(a => a.order)),
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
