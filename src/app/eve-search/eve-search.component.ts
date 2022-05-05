import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { catchError, debounceTime, filter, forkJoin, map, mergeMap, Observable, of, ReplaySubject, Subscription, switchMap, tap } from 'rxjs';
import { MarketerSearchResult, StationDetails, StructureDetails } from '../models';
import { ProductionSettingsService } from '../production/services/production-settings.service';
import { EvepraisalDataRepositoryService } from '../repositories/evepraisal-data-repository.service';
import { ACCOUNTING_SKILL_ID, CharacterService, getAllowedStationIds, getAllowedStructureIds, getStoredSelectedStation, getStoredSelectedStructure, InputErrorStateMatcher, ItemSearchService, UniverseService } from '../shared';

@Component({
  selector: 'app-eve-search',
  templateUrl: './eve-search.component.html',
  styleUrls: ['./eve-search.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EveSearchComponent implements OnInit, OnDestroy {

  @Input()
  public inputItemName$: Observable<string>;

  public defaultFormGroup: FormGroup;
  public itemNameControl = new FormControl(null, [Validators.minLength(3), Validators.required]);
  public itemCountControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(25000), Validators.min(1)]);
  public accountingLevelControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(5), Validators.min(1)]);
  public buyStationControl = new FormControl(null, [Validators.required]);
  public sellStructureControl = new FormControl(null, [Validators.required]);

  public productionFormGroup: FormGroup;
  public runsControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.min(1)]);
  public meLevelControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(5), Validators.min(1)]);
  public teLevelControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(5), Validators.min(1)]);

  public oneToFive = [1, 2, 3, 4, 5];
  private allowedStationIds: number[] = getAllowedStationIds();
  private allowedStructureIds: number[] = getAllowedStructureIds();

  autoCompleteObs: Observable<MarketerSearchResult[] | undefined> | undefined;
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
  private stationsSubscription: Subscription;
  private structuresSubscription: Subscription;
  private inputItemNameSubscription: Subscription;
  private runsSubscription: Subscription;
  private teLevelSubscription: Subscription;
  private meLevelSubscription: Subscription;

  constructor(
    fb: FormBuilder,
    private autoCompleteService : EvepraisalDataRepositoryService,
    private itemSearchService: ItemSearchService,
    private characterService: CharacterService,
    private universeService: UniverseService,
    private productionSettingsService: ProductionSettingsService,
    private router: Router,
    private titleService: Title) { 
      this.defaultFormGroup = fb.group({
        itemName: this.itemNameControl,
        itemCount: this.itemCountControl,
        accountingLevel: this.accountingLevelControl,
        buyStation: this.buyStationControl,
        sellStructure: this.sellStructureControl
      });

      this.productionFormGroup = fb.group({
        runs: this.runsControl,
        meLevel: this.meLevelControl,
        teLevel: this.teLevelControl
      })

      this.matcher = new InputErrorStateMatcher();

      this.initProductionFormGroup();
    }
 
  ngOnInit(): void {
    this.autoCompleteObs = this.itemNameControl.valueChanges.pipe(
      filter((value: string) => value?.trim().length > 2),
      debounceTime(350),
      switchMap((value: string) => {
        return this.autoCompleteService.getAutoCompleteSuggestions(value?.trim())
          .pipe(
            catchError(err => {
              const searchStr = this.itemNameControl.value.toString().trim();
              console.log("A error occoured while requesting auto complete => Fallback to ESI...")
              const esiSearch = this.universeService.findItemByName(searchStr)
              .pipe(
                map(esiSearch => {
                  if(esiSearch.inventory_type) {
                    const fallback: MarketerSearchResult = {
                      id: esiSearch.inventory_type[0]
                    };

                    this.titleService.setTitle(`${searchStr}`)
                    this.router.navigate([], { queryParams: { item: searchStr } });
      
                    return [fallback];
                  }
                  return undefined;
                }
              ));
              return esiSearch;
            })
          );
      })
    );

    const structuresObsArray: Observable<StructureDetails>[] = [];
    this.allowedStructureIds.forEach(structureId => {
      structuresObsArray.push(this.universeService.getStructureDetails(structureId))
    });

    this.allowedStructuresObs = forkJoin(structuresObsArray);

    const stationsObsArray: Observable<StationDetails>[] = [];
    this.allowedStationIds.forEach(stationId => {
      stationsObsArray.push(this.universeService.getStationDetails(stationId))
    });

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
        map(proposals => proposals ? proposals[0] : undefined),
        //filter(foundItem => this.itemNameControl.value.toString().trim().toLowerCase() === foundItem?.name?.toLowerCase()),
        map(item => {
          if(item && item) {
            this.titleService.setTitle(`${item.name}`)
            this.router.navigate([], { queryParams: { item: item.name } });

            console.log("Set currenItem to:", item.id, item.name);
            this.itemSearchService.setCurrentItem({ id: item.id, name: item.name });
          }
          return item;
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

      this.stationsSubscription = this.allowedStationsObs.pipe(
        map(stations => {
          
          const station = stations.find(station => station.station_id === getStoredSelectedStation()) ?? stations[0];
          this.buyStationControl.patchValue(station)
        })
      ).subscribe();

      this.structuresSubscription = this.allowedStructuresObs.pipe(
        map(structures => {        
          const structure = structures.find(station => station.evelyn_structureId === getStoredSelectedStructure()) ?? structures[0];
          this.sellStructureControl.patchValue(structure)
        })
      ).subscribe();
      
    this.inputItemNameSubscription = this.inputItemName$.pipe(
      map(inputValue => this.itemNameControl.setValue(inputValue))
    ).subscribe();

  }

  private initProductionFormGroup(): void {
    this.runsSubscription = this.runsControl.valueChanges.pipe(
      map((runs: number) => this.productionSettingsService.setRuns(runs))
    ).subscribe(); 

    this.teLevelSubscription = this.teLevelControl.valueChanges.pipe(
      map((te: number) => this.productionSettingsService.setTE(te))
    ).subscribe(); 

    this.meLevelSubscription = this.runsControl.valueChanges.pipe(
      map((me: number) => this.productionSettingsService.setME(me))
    ).subscribe(); 
  }

  ngOnDestroy() {
    this.itemCountSubscription.unsubscribe();
    this.searchSubscription.unsubscribe();
    this.initAccountingSkillLevelSubscription.unsubscribe();
    this.accountingSkillLevelSubscription.unsubscribe();
    this.buyStationSubscription.unsubscribe();
    this.sellStructureSubscription.unsubscribe();
    this.stationsSubscription.unsubscribe();
    this.structuresSubscription.unsubscribe();
    this.inputItemNameSubscription.unsubscribe();

    this.runsSubscription?.unsubscribe();
    this.meLevelSubscription?.unsubscribe();
    this.teLevelSubscription?.unsubscribe();
}
}
