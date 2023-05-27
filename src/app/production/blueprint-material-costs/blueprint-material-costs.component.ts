import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { groupBy, map, Observable } from 'rxjs';
import { copyToClipboard, toMultiBuyString, UniverseService } from 'src/app/shared';
import { ManufacturingCostEntry } from '../models/manufacturing-cost-entry';

@Component({
  selector: 'app-blueprint-material-costs',
  templateUrl: './blueprint-material-costs.component.html',
  styleUrls: ['./blueprint-material-costs.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlueprintMaterialCostsComponent implements OnInit {
  
  @Input()
  public manufacturingCosts$: Observable<ManufacturingCostEntry[]>;
  public manufacturingCostsGroupedObs: Observable<Map<string, ManufacturingCostEntry[]>>;

  constructor(
    private universeService: UniverseService,
    private snackBar: MatSnackBar
    ) { }

  ngOnInit(): void {

    this.manufacturingCostsGroupedObs = this.manufacturingCosts$.pipe(
      map(entries => {
        const map = new Map<string, ManufacturingCostEntry[]>();
        entries.forEach(item => {
             const key = item.buyLocation.name;
             const collection = map.get(key);
             if (!collection) {
                 map.set(key, [item]);
             } else {
                 collection.push(item);
             }
        });
        return map;
      })
    );
    
  }

  public getImageForItem(typeId: number | undefined, size = 32): string {
    if(!typeId)
    return "";

    return this.universeService.getImageUrlForType(typeId, size);
  }
  
  public copy(text: string, copyNotification = "Copied!") {
    copyToClipboard(text);
    
    this.snackBar.open(copyNotification, undefined, { duration: 2000 });
  }

  public copyAsMultibuyFormat(entries: ManufacturingCostEntry[], station: string) {
    let multiBuyStr = "";
    entries.forEach(entry => {
      multiBuyStr+= toMultiBuyString(entry.itemName, entry.quantity_total);
    });

    this.copy(multiBuyStr, "Copied material for " + station,);
  }
}
