import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, shareReplay, startWith, Subject } from 'rxjs';
import { BlueprintDetails, ItemDetails } from 'src/app/models';
import { ManufacturingCostEntry } from '../models/manufacturing-cost-entry';
import { SubComponent } from '../models/sub-component';

@Injectable({
  providedIn: 'root'
})
export class ProductionSettingsService {

  private runs$ : Subject<number> = new ReplaySubject(1);
  public RunsObs: Observable<number>;

  private meLevel$ : Subject<number> = new ReplaySubject(1);
  public MeLevelObs: Observable<number>;

  private teLevel$ : Subject<number> = new ReplaySubject(1);
  public TeLevelObs: Observable<number>;

  private blueprint$ : Subject<BlueprintDetails> = new ReplaySubject(1);
  public BlueprintObs: Observable<BlueprintDetails>;

  private subComponents$ : Subject<SubComponent[]> = new ReplaySubject(1);
  public SubComponentsObs: Observable<SubComponent[]>;

  private subBPOs$ : Subject<{ component: SubComponent, bpo?: BlueprintDetails; }[]> = new ReplaySubject(1);
  public SubBPOsObs: Observable<{ component: SubComponent, bpo?: BlueprintDetails; }[]>;
  
  private manufacturingCosts$: Subject<{ item: ItemDetails, bpoCost: ManufacturingCostEntry[]; }[]> = new ReplaySubject(1);
  public ManufacturingCostsObs: Observable<{ item: ItemDetails, bpoCost: ManufacturingCostEntry[]; }[]>;
  constructor() { 
    this.RunsObs = this.runs$.asObservable()
    .pipe( 
      startWith(1), 
      shareReplay(1));

    this.MeLevelObs = this.meLevel$.asObservable()
    .pipe(
      startWith(0), 
      shareReplay(1));

    this.TeLevelObs = this.teLevel$.asObservable()
    .pipe(
      startWith(0), 
      shareReplay(1));

    this.BlueprintObs = this.blueprint$.asObservable().pipe(shareReplay(1));
    this.SubComponentsObs = this.subComponents$.asObservable().pipe(shareReplay(1));
    this.SubBPOsObs = this.subBPOs$.asObservable().pipe(shareReplay(1));
    this.ManufacturingCostsObs = this.manufacturingCosts$.asObservable().pipe(shareReplay(1));
  }
  
  public setRuns(runs : number) {
    this.runs$.next(runs);
  }

  public setME(me : number) {
    this.meLevel$.next(me);
  }

  public setTE(te : number) {
    this.teLevel$.next(te);
  }

  public setBlueprint(blueprint : BlueprintDetails) {
    this.blueprint$.next(blueprint);
  }

  public setSubComponents(subComponents: SubComponent[]) {
    this.subComponents$.next(subComponents);
  }

  public setSubBPOs(subBPOs: { component: SubComponent, bpo?: BlueprintDetails; }[]) {
    this.subBPOs$.next(subBPOs);
  }  

  public setManufacturingCosts(costs: { item: ItemDetails, bpoCost: ManufacturingCostEntry[]; }[]) {
    this.manufacturingCosts$.next(costs);
  }
}
