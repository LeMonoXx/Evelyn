import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, forkJoin, map, mergeMap, Observable, ReplaySubject, Subscription, switchMap, tap } from 'rxjs';
import { MarketerSearchResult, StationDetails, StructureDetails } from '../models';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';
import { ACCOUNTING_SKILL_ID, CharacterService, getAllowedStationIds, getAllowedStructureIds, getStoredSelectedStation, getStoredSelectedStructure, InputErrorStateMatcher, ItemSearchService, UniverseService } from '../shared';

@Component({
  selector: 'app-eve-search',
  templateUrl: './eve-search.component.html',
  styleUrls: ['./eve-search.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EveSearchComponent implements OnInit, OnDestroy {

  public options: FormGroup;
  public itemNameControl = new FormControl(null, [Validators.minLength(3), Validators.required]);
  public itemCountControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(25000), Validators.min(1)]);
  public accountingLevelControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(5), Validators.min(1)]);
  public buyStationControl = new FormControl(null, [Validators.required]);
  public sellStructureControl = new FormControl(null, [Validators.required]);

  public allowedSkillLevels = [1, 2, 3, 4, 5];
  private allowedStationIds: number[] = getAllowedStationIds();
  private allowedStructureIds: number[] = getAllowedStructureIds();

  autoCompleteObs: Observable<MarketerSearchResult[]> | undefined;
  currentItemImageSourceObs: Observable<string> | undefined;
  initAccountingSkillLevelObs: Observable<number>;
  allowedStructuresObs: Observable<StructureDetails[]>;
  allowedStationsObs: Observable<StationDetails[]>;

  matcher: InputErrorStateMatcher;
  
  private itemCountSubscription: Subscription;
  private searchSubscription: Subscription;
  private initAccountingSkillLevelSubscription: Subscription;
  private accountingSkillLevelSubscription: Subscription;
  private buyStationSubscription: Subscription;
  private sellStructureSubscription: Subscription;
  allowedStationsSubscription: Subscription;
  allowedStructuresSubscription: Subscription;

  constructor(
    fb: FormBuilder,
    private eveMarketerDataService : EveMarketerDataRepositoryService,
    private itemSearchService: ItemSearchService,
    private characterService: CharacterService,
    private universeService: UniverseService) { 
      this.options = fb.group({
        itemName: this.itemNameControl,
        itemCount: this.itemCountControl,
        accountingLevel: this.accountingLevelControl
      });

      this.matcher = new InputErrorStateMatcher();
    }
 
  ngOnInit(): void {
    this.autoCompleteObs = this.itemNameControl.valueChanges.pipe(
      filter((value: string) => value?.trim().length > 2),
      debounceTime(150),
      switchMap((value: string) => {
        return this.eveMarketerDataService.getAutoCompleteSuggestions(value?.trim());
      })
    )

    const structuresObsArray: Observable<StructureDetails>[] = [];
    this.allowedStructureIds.forEach(structureId => {
      structuresObsArray.push(this.universeService.getStructureDetails(structureId))
    })

    this.allowedStructuresObs = forkJoin(structuresObsArray);

    const stationsObsArray: Observable<StationDetails>[] = [];
    this.allowedStationIds.forEach(stationId => {
      stationsObsArray.push(this.universeService.getStationDetails(stationId))
    })

    this.allowedStationsObs = forkJoin(stationsObsArray);

    this.initAccountingSkillLevelObs = this.characterService.getAuthenticatedCharacterInfo().pipe(
      switchMap(character => this.characterService.getCharacterSkills(character.CharacterID)),
      map(characterSkill => {
        const accountingSkill = characterSkill.skills.find(skill => skill.skill_id === ACCOUNTING_SKILL_ID);
        if(accountingSkill)
          return accountingSkill?.active_skill_level;

          else return 1;
      }));
    
      this.searchSubscription = this.autoCompleteObs.pipe(
        filter(proposals => this.itemNameControl.value.toString().trim().toLowerCase() === proposals[0]?.name.toLowerCase()),
        map(result => {
          var first = result[0];
  
          this.itemSearchService.setCurrentItem({ id: first.id, name: first.name });
          return first;
      })).subscribe();
  
      this.itemCountSubscription = this.itemCountControl.valueChanges.pipe(
        filter((value: number) => value > 0),
        map((value: number) => this.itemSearchService.setItemCount(value))
      ).subscribe();
  
      this.initAccountingSkillLevelSubscription = this.initAccountingSkillLevelObs.pipe(
      map(level => this.accountingLevelControl.patchValue(level)
      )).subscribe();

      this.accountingSkillLevelSubscription = this.accountingLevelControl.valueChanges.pipe(
        map((level: number) => this.itemSearchService.setAccountingSkillLevel(level))
      ).subscribe();    

      this.buyStationSubscription = this.buyStationControl.valueChanges.pipe(
        map((station: StationDetails) => this.itemSearchService.setBuyStation(station))
      ).subscribe();

      this.sellStructureSubscription = this.sellStructureControl.valueChanges.pipe(
        map((structure: StructureDetails) => this.itemSearchService.setSellStructure(structure))
      ).subscribe();    

      this.allowedStationsSubscription = this.allowedStationsObs.pipe(
        map(stations => {
          
          const station = stations.find(station => station.station_id === getStoredSelectedStation()) ?? stations[0];
          this.buyStationControl.patchValue(station)
        })
      ).subscribe();

      this.allowedStructuresSubscription = this.allowedStructuresObs.pipe(
        map(structures => {        
          const structure = structures.find(station => station.evelyn_structureId === getStoredSelectedStructure()) ?? structures[0];
          this.sellStructureControl.patchValue(structure)
        })
      ).subscribe();
  }

  ngOnDestroy() {
    this.itemCountSubscription.unsubscribe();
    this.searchSubscription.unsubscribe();
    this.initAccountingSkillLevelSubscription.unsubscribe();
    this.accountingSkillLevelSubscription.unsubscribe();
    this.buyStationSubscription.unsubscribe();
    this.sellStructureSubscription.unsubscribe();
    this.allowedStationsSubscription.unsubscribe();
    this.allowedStructuresSubscription.unsubscribe();
}
}
