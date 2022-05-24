import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { calculateComponentCosts, calculateTotalCosts, copyToClipboard, UniverseService } from 'src/app/shared';
import { ManufacturingCalculation, ManufacturingCostEntry, SubComponent } from '..';

@Component({
  selector: 'app-blueprint-manufacturing',
  templateUrl: './blueprint-manufacturing.component.html',
  styleUrls: ['./blueprint-manufacturing.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlueprintManufacturingComponent implements OnInit {

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
  
  public getImageForItem(typeId: number | undefined): string {
    if(!typeId)
    return "";

    return this.universeService.getImageUrlForType(typeId, 32);
  }

  public getComponentCosts(component: ManufacturingCostEntry[]): number {
    return calculateComponentCosts(component);
  }

}
