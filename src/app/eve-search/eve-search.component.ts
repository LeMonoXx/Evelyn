import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { catchError, debounceTime, filter, forkJoin, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { MarketerSearchResult, StationDetails, StructureDetails } from '../models';
import { ProductionSettingsService } from '../production/services/production-settings.service';
import { EveMarketerDataRepositoryService } from '../repositories';
import { EvepraisalDataRepositoryService } from '../repositories/evepraisal-data-repository.service';
import { ACCOUNTING_SKILL_ID, BuyMode, CharacterService, getAllowedBuyModes, getAllowedShippingServices, getAllowedStationIds, getAllowedStructureIds, getStoredBuyMode, getStoredMELevel, getStoredSelectedShippingService, getStoredSelectedStation, 
  getStoredSelectedStructure, getStoredSubMELevel, InputErrorStateMatcher, ItemSearchService, ShippingService, UniverseService } from '../shared';

@Component({
  selector: 'app-eve-search',
  templateUrl: './eve-search.component.html',
  styleUrls: ['./eve-search.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EveSearchComponent implements OnInit, OnDestroy {

  @Input()
  public inputItemName$: Observable<string>;

  @Input()
  public mode: string;

  public defaultFormGroup: FormGroup;
  public itemNameControl = new FormControl(null, [Validators.minLength(3), Validators.required]);
  public itemCountControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(25000), Validators.min(1)]);
  public accountingLevelControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.max(5), Validators.min(1)]);

  public productionFormGroup: FormGroup;
  public runsControl = new FormControl(1, [Validators.pattern("[0-9]*"), Validators.min(1)]);
  public meLevelControl = new FormControl(0, [Validators.pattern("[0-9]*"), Validators.max(10), Validators.min(0)]);
  public subMeLevelControl = new FormControl(0, [Validators.pattern("[0-9]*"), Validators.max(10), Validators.min(0)]);
  public teLevelControl = new FormControl(0, [Validators.pattern("[0-9]*"), Validators.max(20), Validators.min(0)]);

  public shippingFormGroup: FormGroup;
  public buyStationControl = new FormControl(null, [Validators.required]); 
  public buyModeControl = new FormControl(null, [Validators.required]);
  public selectedBuyMode: BuyMode;
  
  public sellStructureControl = new FormControl(null, [Validators.required]);
  public shippingServiceControl = new FormControl(null, [Validators.required]);

  public oneToFive = [1, 2, 3, 4, 5];
  public zeroToTen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  public zeroToTwenty = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  private allowedStationIds: number[] = getAllowedStationIds();
  private allowedStructureIds: number[] = getAllowedStructureIds();
  private allowedShippingServices: ShippingService[] = getAllowedShippingServices();
  private allowedBuyModes: BuyMode[] = getAllowedBuyModes();

  autoCompleteObs: Observable<MarketerSearchResult[] | undefined> | undefined;
  currentItemImageSourceObs: Observable<string> | undefined;
  initAccountingSkillLevelObs: Observable<number>;
  allowedStructuresObs: Observable<StructureDetails[]>;
  allowedStationsObs: Observable<StationDetails[]>;
  allowedShippingServicesObs: Observable<ShippingService[]>;
  allowedBuyModesObs: Observable<BuyMode[]>;

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
  private subMeLevelSubscription: Subscription;
  private allowedShippingServicesSubscription: Subscription;
  private shippingServiceSubscription: Subscription;
  private buyModeSubscription: Subscription;
  private allowedBuyModesSubscription: Subscription;

  constructor(
    fb: FormBuilder,
    private autoCompleteService : EveMarketerDataRepositoryService,
    private itemSearchService: ItemSearchService,
    private characterService: CharacterService,
    private universeService: UniverseService,
    private productionSettingsService: ProductionSettingsService,
    private router: Router,
    private titleService: Title) { 
      this.defaultFormGroup = fb.group({
        itemName: this.itemNameControl,
        itemCount: this.itemCountControl,
        accountingLevel: this.accountingLevelControl
      });

      this.shippingFormGroup = fb.group({
        buyStation: this.buyStationControl,
        sellStructure: this.sellStructureControl,
        shippingService: this.shippingServiceControl
      })

      this.productionFormGroup = fb.group({
        buyMode: this.buyModeControl,
        runs: this.runsControl,
        meLevel: this.meLevelControl,
        subMeLevel: this.subMeLevelControl,
        teLevel: this.teLevelControl
      });

      this.matcher = new InputErrorStateMatcher();

      this.initProductionFormGroup();
    }
 
  ngOnInit(): void {
    this.autoCompleteObs = this.itemNameControl.valueChanges.pipe(
      filter((value: string) => value?.trim().length > 2),
      debounceTime(150),
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

    this.allowedShippingServicesObs = of(this.allowedShippingServices);

    this.allowedBuyModesObs = of(this.allowedBuyModes);

    this.initAccountingSkillLevelObs = this.characterService.getAuthenticatedCharacterInfo().pipe(
      switchMap(character => this.characterService.getCharacterSkills(character.CharacterID)),
      map(characterSkill => {
        const accountingSkill = characterSkill.skills.find(skill => skill.skill_id === ACCOUNTING_SKILL_ID);
        if(accountingSkill)
          return accountingSkill?.active_skill_level;

          else return 0;
      }));
    
      this.searchSubscription = this.autoCompleteObs.pipe(
        map(proposals => proposals ? proposals[0] : undefined),
        filter(foundItem => this.itemNameControl.value.toString().trim().toLowerCase() === foundItem?.name?.toLowerCase()),
        map(item => {
          if(item && item) {
            this.titleService.setTitle(`${item.name}`)
            this.router.navigate([], { queryParams: { item: item.name } });

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
      
      this.buyModeSubscription = this.buyModeControl.valueChanges.pipe(
        map((mode: BuyMode) => this.productionSettingsService.setBuyMode(mode))
      ).subscribe();

      this.sellStructureSubscription = this.sellStructureControl.valueChanges.pipe(
        map((structure: StructureDetails) => this.itemSearchService.setSellStructure(structure))
      ).subscribe();    

      this.shippingServiceSubscription = this.shippingServiceControl.valueChanges.pipe(
        map((service: ShippingService) => this.itemSearchService.setShippingService(service))
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

      this.allowedShippingServicesSubscription = this.allowedShippingServicesObs.pipe(
        map(services => {        
          const service = services.find(service => service.id === getStoredSelectedShippingService()) ?? services[0];
          this.shippingServiceControl.patchValue(service)
        })
      ).subscribe();

      if(this.inputItemName$)
        this.inputItemNameSubscription = this.inputItemName$.pipe(
        map(inputValue => this.itemNameControl.setValue(inputValue))
        ).subscribe();

      this.allowedBuyModesSubscription = this.allowedBuyModesObs.pipe(
        map(modes => {
          const mode = modes.find(mode => mode.id === getStoredBuyMode()) ?? modes[0];
          this.buyModeControl.patchValue(mode);
          this.selectedBuyMode = mode;
        })
      ).subscribe();

      this.meLevelControl.patchValue(getStoredMELevel());
      this.subMeLevelControl.patchValue(getStoredSubMELevel());
  }

  private initProductionFormGroup(): void {
    this.runsSubscription = this.runsControl.valueChanges.pipe(
      map((runs: number) => this.productionSettingsService.setRuns(runs))
    ).subscribe(); 

    this.teLevelSubscription = this.teLevelControl.valueChanges.pipe(
      map((te: number) => this.productionSettingsService.setTE(te))
    ).subscribe(); 

    this.meLevelSubscription = this.meLevelControl.valueChanges.pipe(
      map((me: number) => this.productionSettingsService.setME(me))
    ).subscribe();   
    
    this.subMeLevelSubscription = this.subMeLevelControl.valueChanges.pipe(
      map((me: number) => this.productionSettingsService.setSubME(me))
    ).subscribe(); 
  }

  ngOnDestroy() {
    this.itemCountSubscription.unsubscribe();
    this.searchSubscription.unsubscribe();
    this.initAccountingSkillLevelSubscription.unsubscribe();
    this.accountingSkillLevelSubscription.unsubscribe();
    this.buyStationSubscription.unsubscribe();
    this.buyModeSubscription.unsubscribe();
    this.allowedBuyModesSubscription.unsubscribe();
    this.sellStructureSubscription.unsubscribe();
    this.stationsSubscription.unsubscribe();
    this.structuresSubscription.unsubscribe();
    this.allowedShippingServicesSubscription.unsubscribe();
    this.shippingServiceSubscription.unsubscribe();
    this.inputItemNameSubscription.unsubscribe();

    this.runsSubscription?.unsubscribe();
    this.meLevelSubscription?.unsubscribe();
    this.subMeLevelSubscription?.unsubscribe();
    this.teLevelSubscription?.unsubscribe();
}
}
