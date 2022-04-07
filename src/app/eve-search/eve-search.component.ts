import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, map, Observable, publishReplay, ReplaySubject, Subject, switchMap } from 'rxjs';
import { MarketerSearchResult } from '../models';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';

@Component({
  selector: 'app-eve-search',
  templateUrl: './eve-search.component.html',
  styleUrls: ['./eve-search.component.scss']
})
export class EveSearchComponent implements OnInit {

  myControl = new FormControl();
  options: MarketerSearchResult[] = [];
  mySearchObs: Observable<MarketerSearchResult> = new ReplaySubject();
  autoCompleteObs: Observable<MarketerSearchResult[]> | undefined;
  currentItemImageSourceObs: Observable<string> | undefined;

  constructor(
    private eveMarketerDataService : EveMarketerDataRepositoryService,
    private esiDataService: EsiDataRepositoryService) { }

  ngOnInit(): void {

    this.autoCompleteObs = this.myControl.valueChanges.pipe(
      filter((value: string) => value.length > 2),
      debounceTime(500),
      switchMap((value: string) => {
        console.log('form changed to: ', value);  
        return this.eveMarketerDataService.getAutoCompleteSuggestions(value);
      })
    )

    this.mySearchObs = this.autoCompleteObs.pipe(
      filter(proposals => this.myControl.value === proposals[0]?.name),
      map(result => {
        var first = result[0];
        console.log('mySearchObs: next',first);  
        return first;
    }));

    this.currentItemImageSourceObs = this.mySearchObs.pipe(
        switchMap(item => this.esiDataService.getImageForType(item.id)));
  }

}
