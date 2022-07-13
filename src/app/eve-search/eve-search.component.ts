import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { catchError, combineLatest, debounceTime, filter, forkJoin, map, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { MarketerSearchResult } from '../models';
import { ProductionSettingsService } from '../production/services/production-settings.service';
import { EveMarketerDataRepositoryService } from '../repositories';
import { EvepraisalDataRepositoryService } from '../repositories/evepraisal-data-repository.service';
import { ACCOUNTING_SKILL_ID, BuyMode, CharacterService, getAllowedBuyModes, getShippingServices, 
  getAllowedStationIds, getAllowedStructureIds, getStoredBuyMode, getStoredMELevel, getStoredSelectedShippingService, getStoredStartStation, 
  getStoredEndStation, getStoredSubMELevel, InputErrorStateMatcher, ItemSearchService, ShippingService, 
  UniverseService, ShippingServicesHasRoute, GeneralStation } from '../shared';

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

  @Input()
  public startStationLabelContent: string = "Buy station";
  @Input()
  public endStationLabelContent: string = "Sell station";

  public defaultFormGroup: UntypedFormGroup;
  public itemNameControl = new UntypedFormControl(null, [Validators.minLength(3), Validators.required]);
  public itemCountControl = new UntypedFormControl(1, [Validators.pattern("[0-9]*"), Validators.max(25000), Validators.min(1)]);
  public accountingLevelControl = new UntypedFormControl(1, [Validators.pattern("[0-9]*"), Validators.max(5), Validators.min(1)]);

  public productionFormGroup: UntypedFormGroup;
  public runsControl = new UntypedFormControl(1, [Validators.pattern("[0-9]*"), Validators.min(1)]);
  public meLevelControl = new UntypedFormControl(0, [Validators.pattern("[0-9]*"), Validators.max(10), Validators.min(0)]);
  public subMeLevelControl = new UntypedFormControl(0, [Validators.pattern("[0-9]*"), Validators.max(10), Validators.min(0)]);
  public teLevelControl = new UntypedFormControl(0, [Validators.pattern("[0-9]*"), Validators.max(20), Validators.min(0)]);

  public shippingFormGroup: UntypedFormGroup;
  public startStationControl = new UntypedFormControl(null, [Validators.required]); 
  public buyModeControl = new UntypedFormControl(null, [Validators.required]);
  public selectedBuyMode: BuyMode;
  
  public endStationControl = new UntypedFormControl(null, [Validators.required]);
  public shippingServiceControl = new UntypedFormControl(null, [Validators.required]);

  public oneToFive = [1, 2, 3, 4, 5];
  public zeroToTen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  public zeroToTwenty = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  private allowedStationIds: number[] = getAllowedStationIds();
  private allowedStructureIds: number[] = getAllowedStructureIds();
  private allShippingServices: ShippingService[] = getShippingServices();
  private allowedBuyModes: BuyMode[] = getAllowedBuyModes();

  autoCompleteObs: Observable<MarketerSearchResult[] | undefined> | undefined;
  currentItemImageSourceObs: Observable<string> | undefined;
  initAccountingSkillLevelObs: Observable<number>;
  allowedStartStationsObs: Observable<GeneralStation[]>;
  allowedEndStationsObs: Observable<GeneralStation[]>;
  allowedShippingServicesObs: Observable<ShippingService[]>;
  allowedBuyModesObs: Observable<BuyMode[]>;

  matcher: InputErrorStateMatcher;
  
  private itemCountSubscription: Subscription;
  private searchSubscription: Subscription;
  private initAccountingSkillLevelSubscription: Subscription;
  private accountingSkillLevelSubscription: Subscription;
  private startStationSubscription: Subscription;
  private endStationSubscription: Subscription;
  private startStationsSubscription: Subscription;
  private endStationsSubscription: Subscription;
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
    fb: UntypedFormBuilder,
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
        startStation: this.startStationControl,
        endStation: this.endStationControl,
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

    const structuresObsArray: Observable<GeneralStation>[] = [];
    this.allowedStructureIds.forEach(structureId => {
      structuresObsArray.push(this.universeService.getStructureDetails(structureId))
    });

    this.allowedEndStationsObs = forkJoin(structuresObsArray);

    const stationsObsArray: Observable<GeneralStation>[] = [];
    this.allowedStationIds.forEach(stationId => {
      stationsObsArray.push(this.universeService.getStationDetails(stationId))
    });

    this.allowedStartStationsObs = forkJoin(stationsObsArray);

    this.allowedShippingServicesObs = combineLatest([this.itemSearchService.StartStationObs, this.itemSearchService.EndStationObs]).pipe(
      map(([startStation, endStation]) => {
        return this.allShippingServices.filter(service => service.id === 0 || ShippingServicesHasRoute(service, startStation, endStation))
      }));

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

      this.startStationSubscription = this.startStationControl.valueChanges.pipe(
        map((station: GeneralStation) => this.itemSearchService.setStartStation(station))
      ).subscribe();

      this.endStationSubscription = this.endStationControl.valueChanges.pipe(
        map((station: GeneralStation) => this.itemSearchService.setEndStation(station))
      ).subscribe();    

      this.shippingServiceSubscription = this.shippingServiceControl.valueChanges.pipe(
        map((service: ShippingService) => this.itemSearchService.setShippingService(service))
      ).subscribe();

      this.startStationsSubscription = this.allowedStartStationsObs.pipe(
        map(stations => {
          
          const station = stations.find(station => station.station_Id === getStoredStartStation()) ?? stations[0];
          this.startStationControl.patchValue(station, )
        })
      ).subscribe();

      this.endStationsSubscription = this.allowedEndStationsObs.pipe(
        map(stations => {        
          const station = stations.find(station => station.station_Id === getStoredEndStation()) ?? stations[0];
          console.log("patchValue", station)
          this.endStationControl.patchValue(station)
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

  public compareStations(o1: GeneralStation, o2: GeneralStation): boolean {
    return o1.station_Id === o2.station_Id;
  }

  private initProductionFormGroup(): void {  
    this.buyModeSubscription = this.buyModeControl.valueChanges.pipe(
      map((mode: BuyMode) => this.productionSettingsService.setBuyMode(mode))
    ).subscribe();

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
    this.startStationSubscription.unsubscribe();
    this.allowedBuyModesSubscription.unsubscribe();
    this.endStationSubscription.unsubscribe();
    this.startStationsSubscription.unsubscribe();
    this.endStationsSubscription.unsubscribe();
    this.allowedShippingServicesSubscription.unsubscribe();
    this.shippingServiceSubscription.unsubscribe();

    this.inputItemNameSubscription?.unsubscribe();

    this.buyModeSubscription?.unsubscribe();
    this.runsSubscription?.unsubscribe();
    this.meLevelSubscription?.unsubscribe();
    this.subMeLevelSubscription?.unsubscribe();
    this.teLevelSubscription?.unsubscribe();
}
}
