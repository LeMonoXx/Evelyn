import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { ItemDetails } from 'src/app/models';
import { calculateComponentMaterialCosts, calculateTotalMaterialCosts, copyToClipboard, toMultiBuyString, UniverseService } from 'src/app/shared';
import { ManufacturingCalculation, ManufacturingCostEntry, SubComponent } from '..';

@Component({
  selector: 'app-blueprint-manufacturing',
  templateUrl: './blueprint-manufacturing.component.html',
  styleUrls: ['./blueprint-manufacturing.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlueprintManufacturingComponent implements OnInit {
  @Input()
  public targetItem$: Observable<ItemDetails>;

  @Input()
  public subBPOsManufacturingCosts$: Observable<ManufacturingCalculation[]>;
  
  constructor(
    private universeService: UniverseService,
    private snackBar: MatSnackBar) { }

  public ngOnInit(): void { 
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
  
  public getImageForItem(typeId: number | undefined, size = 32): string {
    if(!typeId)
    return "";

    return this.universeService.getImageUrlForType(typeId, size);
  }

  public getComponentCosts(component: ManufacturingCostEntry[]): number {
    return calculateComponentMaterialCosts(component);
  }

public copyAllManufacturingCalculation(manuCalcs: ManufacturingCalculation[]) {
  let str = "";
  manuCalcs.forEach(entry => {
    const entryStr = this.manufacturingCalculationToMultiBuy(entry);
    str += entryStr;
  })

  this.copy(str);
}

  public copyManufacturingCalculation(manuCalc: ManufacturingCalculation) {
    const str = this.manufacturingCalculationToMultiBuy(manuCalc);
    this.copy(str);
  }

  public manufacturingCalculationToMultiBuy(manuCalc: ManufacturingCalculation) {
    let str = "";
    if(manuCalc.bpoCost && manuCalc.bpoCost.length > 1) {
      manuCalc.bpoCost.forEach(entry => {
        const partStr = toMultiBuyString(entry.itemName, entry.quantity_total);
        str += partStr;
      });
    } else {
      str = toMultiBuyString(manuCalc.item.name, manuCalc.reqAmount);
    }

    return str;
  }

}
