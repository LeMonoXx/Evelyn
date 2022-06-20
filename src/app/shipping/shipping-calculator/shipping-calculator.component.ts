import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, debounceTime, map, Observable, switchMap } from 'rxjs';
import { ItemDetails } from 'src/app/models';
import { EveMarketerDataRepositoryService } from 'src/app/repositories';
import { ItemSearchService, CharacterService, UniverseService, InputErrorStateMatcher } from 'src/app/shared';

@Component({
  selector: 'app-shipping-calculator',
  templateUrl: './shipping-calculator.component.html',
  styleUrls: ['./shipping-calculator.component.scss']
})
export class ShippingCalculatorComponent implements OnInit {

  public shippingCalcGroup: FormGroup;
  public itemListControl = new FormControl(null, [Validators.minLength(3), Validators.required]);
  public matcher: InputErrorStateMatcher;

  constructor(
    fb: FormBuilder,
    private itemSearchService: ItemSearchService,
    private characterService: CharacterService,
    private universeService: UniverseService,
    private autoCompleteService : EveMarketerDataRepositoryService) { 
    this.shippingCalcGroup = fb.group({
      itemName: this.itemListControl
    });

    this.matcher = new InputErrorStateMatcher();
  }

  ngOnInit(): void {
    this.itemListControl.valueChanges.pipe(
      filter((value: string) => value?.trim().length > 2),
      debounceTime(50),
      map((value: string) => {
        const result: Observable<{ item: ItemDetails, count: number }>[] = [];      
        var lines = value.split("\n");
        lines.forEach(line => {
          const itemArray = line.split("\t");
          const itemName = itemArray[0];
          const countStr = itemArray.length > 1 ? itemArray[1] : "1";
          const count = parseInt(countStr);
          console.log("item: ", itemName, countStr, count);

          const itemObs = this.universeService.findItemByName(itemName).pipe(
            map(item => item.inventory_type[0]),
            switchMap(typeId => this.universeService.getItemDetails(typeId).pipe(
              map(item => ({ item: item, count: count }))
            ))
          );

          result.push(itemObs);
          
        })
      })).subscribe();
  }

}
