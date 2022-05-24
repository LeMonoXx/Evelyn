import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, switchMap, tap } from 'rxjs';
import { BlueprintDetails, ItemDetails } from 'src/app/models';
import { calculateTotalCosts, copyToClipboard, UniverseService } from 'src/app/shared';
import { ManufacturingCalculation } from '..';

@Component({
  selector: 'app-blueprint-details',
  templateUrl: './blueprint-details.component.html',
  styleUrls: ['./blueprint-details.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BlueprintDetailsComponent implements OnInit {

  @Input()
  public BPOItem$: Observable<ItemDetails>;

  @Input()
  public BPODetails$: Observable<BlueprintDetails>;

  @Input()
  public subBPOsManufacturingCosts$: Observable<ManufacturingCalculation[]>;
  
  public currentItemImageSourceObs: Observable<string>;
  public productObs: Observable<{ product: ItemDetails, imageSource: string }>;
  public totalMaterialCostsObs: Observable<number>;
  
  constructor(
    private universeService: UniverseService,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    
    this.currentItemImageSourceObs = this.BPOItem$.pipe(
      map(item => {
        return this.universeService.getImageUrlForType(item.type_id, 64);
      }));

      this.productObs = this.BPODetails$.pipe(
        switchMap(bpo => this.universeService.getItemDetails(bpo.activities.manufacturing.products[0].typeID)),
        map(item => ({ product: item, imageSource: this.universeService.getImageUrlForType(item.type_id, 64) }))
      )

      this.totalMaterialCostsObs = this.subBPOsManufacturingCosts$.pipe(
        map(entries => calculateTotalCosts(entries))); 
  }
  
  public copy(text: string) {
    copyToClipboard(text);

    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }
}
