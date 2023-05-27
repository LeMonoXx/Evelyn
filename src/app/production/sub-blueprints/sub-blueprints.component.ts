import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { debounceTime, map, Observable } from 'rxjs';
import { copyToClipboard, UniverseService } from 'src/app/shared';
import { SubComponent } from '../models/sub-component';

@Component({
  selector: 'app-sub-blueprints',
  templateUrl: './sub-blueprints.component.html',
  styleUrls: ['./sub-blueprints.component.scss'],
  encapsulation: ViewEncapsulation.None 
})
export class SubBlueprintsComponent implements OnInit {

  @Input()
  public subBPOs$: Observable<SubComponent[]>;
  public subComponentsObs: Observable<SubComponent[]>;
  constructor(
    private snackBar: MatSnackBar,
    private universeService: UniverseService) { }

  ngOnInit(): void {

    this.subComponentsObs = this.subBPOs$.pipe(
      debounceTime(100),
      map(entries => entries.filter(s => s.bpo != null))
    )
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

  public calculateRequiredBPCAmount(requiredRuns: number, bpcMaxRuns: number) : number {

    if(bpcMaxRuns >= requiredRuns)
      return 1;

    return Math.abs(requiredRuns  / bpcMaxRuns);
  }
}
