import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, shareReplay, Subject } from 'rxjs';

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
  
  constructor() { 
    this.RunsObs = this.runs$.asObservable()
    .pipe(shareReplay(1));
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
}
