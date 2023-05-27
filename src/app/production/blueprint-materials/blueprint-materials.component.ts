import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Observable } from 'rxjs';
import { ItemDetails } from 'src/app/models';
import { calculateComponentMaterialCosts, copyToClipboard, toMultiBuyString, UniverseService } from 'src/app/shared';
import { ManufacturingCalculation, ManufacturingCostEntry, SubComponent } from '..';

@Component({
  selector: 'app-blueprint-materials',
  templateUrl: './blueprint-materials.component.html',
  styleUrls: ['./blueprint-materials.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlueprintMaterialsComponent implements OnInit {
  @Input()
  public targetItem$: Observable<ItemDetails>;

  @Input()
  public allRequiredMaterials$: Observable<{ subComponent: SubComponent; reqAmount: number; subMaterials: { itemDetails: ItemDetails; quantity_total: number; }[]; }[]>;
  
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
  }

  public copyComponentMaterial(entry: { subComponent: SubComponent; reqAmount: number; subMaterials: { itemDetails: ItemDetails; quantity_total: number; }[]}) {
    let text = toMultiBuyString(entry.subComponent.item.name, entry.reqAmount);
    this.copy(text);
    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }

  public copySubComponentMaterial(subMaterial: { itemDetails: ItemDetails; quantity_total: number; }) {
    let text = toMultiBuyString(subMaterial.itemDetails.name, subMaterial.quantity_total);
    this.copy(text);
    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }

  public copySubMaterials(subMaterials: { itemDetails: ItemDetails; quantity_total: number; }[]) {
    let multiBuyStr = "";
    subMaterials.forEach(material => {
      multiBuyStr+= toMultiBuyString(material.itemDetails.name, material.quantity_total);
    });

    copyToClipboard(multiBuyStr);
    this.snackBar.open("Copied materials for component", undefined, { duration: 2000 });
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
  this.snackBar.open("Copied!", undefined, { duration: 2000 });
}

  public copyManufacturingCalculation(manuCalc: ManufacturingCalculation) {
    const str = this.manufacturingCalculationToMultiBuy(manuCalc);
    this.copy(str);
    this.snackBar.open("Copied!", undefined, { duration: 2000 });
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
