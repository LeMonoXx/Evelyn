import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, shareReplay, startWith, Subject } from 'rxjs';
import { BuyMode, storeSelectedBuyMode, storeSelectedMELevel, storeSelectedSubMELevel } from 'src/app/shared';

@Injectable({
  providedIn: 'root'
})
export class ProductionSettingsService {

  private runs$ : Subject<number> = new ReplaySubject(1);
  public RunsObs: Observable<number>;

  private meLevel$ : Subject<number> = new ReplaySubject(1);
  public MeLevelObs: Observable<number>;
  
  private subMeLevel$ : Subject<number> = new ReplaySubject(1);
  public SubMeLevelObs: Observable<number>;

  private teLevel$ : Subject<number> = new ReplaySubject(1);
  public TeLevelObs: Observable<number>;

  private buyMode$ : Subject<BuyMode> = new ReplaySubject(1);
  public BuyModeObs: Observable<BuyMode>;

  constructor() { 
    this.RunsObs = this.runs$.asObservable()
    .pipe( 
      startWith(1), 
      shareReplay(1));

    this.MeLevelObs = this.meLevel$.asObservable()
    .pipe(
      startWith(0), 
      shareReplay(1));

    this.SubMeLevelObs = this.subMeLevel$.asObservable()
    .pipe(
      startWith(0), 
      shareReplay(1));

    this.TeLevelObs = this.teLevel$.asObservable()
    .pipe(
      startWith(0), 
      shareReplay(1));

      this.BuyModeObs = this.buyMode$.asObservable()
      .pipe(shareReplay(1));
  }
  
  public setRuns(runs : number) {
    
    this.runs$.next(runs);
  }

  public setME(me : number) {
    storeSelectedMELevel(me);
    this.meLevel$.next(me);
  }
  
  public setSubME(me : number) {
    storeSelectedSubMELevel(me);
    this.subMeLevel$.next(me);
  }

  public setTE(te : number) {
    this.teLevel$.next(te);
  }
    
  public setBuyMode(mode: BuyMode) {
    storeSelectedBuyMode(mode);
    this.buyMode$.next(mode);
  }

}
