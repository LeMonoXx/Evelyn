import { Injectable } from '@angular/core';
import { debounceTime, distinctUntilChanged, Observable, ReplaySubject, shareReplay, startWith, Subject, tap } from 'rxjs';

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

  constructor() { 
    this.RunsObs = this.runs$.asObservable()
    .pipe( 
      startWith(1), 
      shareReplay(1),
      debounceTime(50));

    this.MeLevelObs = this.meLevel$.asObservable()
    .pipe(
      startWith(0), 
      shareReplay(1),
      debounceTime(50));

    this.SubMeLevelObs = this.subMeLevel$.asObservable()
    .pipe(
      startWith(0), 
      shareReplay(1),
      debounceTime(50));

    this.TeLevelObs = this.teLevel$.asObservable()
    .pipe(
      startWith(0), 
      shareReplay(1),
      debounceTime(50));
  }
  
  public setRuns(runs : number) {
    this.runs$.next(runs);
  }

  public setME(me : number) {
    this.meLevel$.next(me);
  }
  
  public setSubME(me : number) {
    this.subMeLevel$.next(me);
  }

  public setTE(te : number) {
    this.teLevel$.next(te);
  }
}
