import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { ItemDetails } from '../models';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';
import { ItemIdentifier, ItemSearchService } from '../shared';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {

  public currentItemObs: Observable<ItemIdentifier>;
  public currentSellStationObs: Observable<number> = new BehaviorSubject(1038457641673);
  public numberCountObs: Observable<number>;
  public itemDetailsObs: Observable<ItemDetails>;

  constructor(public esiDataService: EsiDataRepositoryService,
    public eveMarketerDataService: EveMarketerDataRepositoryService,
    public itemSearchService: ItemSearchService) {

      this.currentItemObs = this.itemSearchService.CurrentItemObs;
      this.numberCountObs = this.itemSearchService.ItemCountObs;
      this.itemDetailsObs = this.itemSearchService.CurrentItemDetailsObs;
     }

  ngOnInit(): void {

  }

  public get authValid() : boolean {
    return AuthService.hasValidAccessToken();
}
}
