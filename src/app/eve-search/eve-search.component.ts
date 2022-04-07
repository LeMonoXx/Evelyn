import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, filter, map, Observable, switchMap } from 'rxjs';
import { MarketerSearchResult } from '../models';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';
import { InputErrorStateMatcher } from '../shared';

@Component({
  selector: 'app-eve-search',
  templateUrl: './eve-search.component.html',
  styleUrls: ['./eve-search.component.scss']
})
export class EveSearchComponent implements OnInit {

  options: FormGroup;
  itemNameControl = new FormControl(null, [Validators.minLength(4), Validators.required]);
  itemCountControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(25000), Validators.min(1)])

  typeCount: number = 1;
  mySearchObs: Observable<MarketerSearchResult> = new Observable();
  autoCompleteObs: Observable<MarketerSearchResult[]> | undefined;
  currentItemImageSourceObs: Observable<string> | undefined;
  matcher: InputErrorStateMatcher;

  constructor(
    fb: FormBuilder,
    private eveMarketerDataService : EveMarketerDataRepositoryService,
    private esiDataService: EsiDataRepositoryService) { 
      this.options = fb.group({
        itemName: this.itemNameControl,
        itemCount: this.itemCountControl,
      });

      this.matcher = new InputErrorStateMatcher();
    }

  ngOnInit(): void {
    this.autoCompleteObs = this.itemNameControl.valueChanges.pipe(
      filter((value: string) => value.length > 2),
      debounceTime(500),
      switchMap((value: string) => {
        return this.eveMarketerDataService.getAutoCompleteSuggestions(value);
      })
    )

    this.mySearchObs = this.autoCompleteObs.pipe(
      filter(proposals => this.itemNameControl.value.toString().toLowerCase() === proposals[0]?.name.toLowerCase()),
      map(result => {
        var first = result[0];
        console.log('mySearchObs: next',first);  
        return first;
    }));

    this.currentItemImageSourceObs = this.mySearchObs.pipe(
      map(item => {
        console.log('getImageUrlForType for', item);  
        return this.esiDataService.getImageUrlForType(item.id, 64);
      }));
  }
}
