import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, filter, map, Observable, Subscription, switchMap } from 'rxjs';
import { MarketerSearchResult } from '../models';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';
import { InputErrorStateMatcher, ItemSearchService } from '../shared';

@Component({
  selector: 'app-eve-search',
  templateUrl: './eve-search.component.html',
  styleUrls: ['./eve-search.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EveSearchComponent implements OnInit, OnDestroy {

  options: FormGroup;
  itemNameControl = new FormControl(null, [Validators.minLength(4), Validators.required]);
  itemCountControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(25000), Validators.min(1)])

  mySearchObs: Observable<MarketerSearchResult> = new Observable();
  autoCompleteObs: Observable<MarketerSearchResult[]> | undefined;
  currentItemImageSourceObs: Observable<string> | undefined;
  matcher: InputErrorStateMatcher;
  
  itemCountSubscription: Subscription;
  searchSubscription: Subscription;

  constructor(
    fb: FormBuilder,
    private eveMarketerDataService : EveMarketerDataRepositoryService,
    private itemSearchService: ItemSearchService) { 
      this.options = fb.group({
        itemName: this.itemNameControl,
        itemCount: this.itemCountControl,
      });

      this.matcher = new InputErrorStateMatcher();
    }
 
  ngOnInit(): void {
    this.autoCompleteObs = this.itemNameControl.valueChanges.pipe(
      filter((value: string) => value?.trim().length > 2),
      debounceTime(200),
      switchMap((value: string) => {
        return this.eveMarketerDataService.getAutoCompleteSuggestions(value?.trim());
      })
    )

    this.searchSubscription = this.autoCompleteObs.pipe(
      filter(proposals => this.itemNameControl.value.toString().trim().toLowerCase() === proposals[0]?.name.toLowerCase()),
      map(result => {
        var first = result[0];

        this.itemSearchService.setCurrentItem({ id: first.id, name: first.name });
        return first;
    })).subscribe();

    this.itemCountSubscription = this.itemCountControl.valueChanges.pipe(
      filter((value: number) => value > 0),
      map((value: number) => {
        console.log("count set");
        this.itemSearchService.setItemCount(value);
      })
    ).subscribe()
  }

  ngOnDestroy() {
    this.itemCountSubscription.unsubscribe()
    this.searchSubscription.unsubscribe()
}
}
