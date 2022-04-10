import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';
import { ItemIdentifier, ItemSearchService } from '../shared';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  public currentItemObs: Observable<ItemIdentifier>;
  public currentSellStationObs: Observable<number> = new BehaviorSubject(1038457641673);
  public numberCountObs: Observable<number>;

  constructor(public esiDataService: EsiDataRepositoryService,
    public eveMarketerDataService: EveMarketerDataRepositoryService,
    public itemSearchService: ItemSearchService) {

      this.currentItemObs = this.itemSearchService.CurrentItemObs;
      this.numberCountObs = this.itemSearchService.ItemCountObs;
     }

  ngOnInit(): void {

  }

  public get authValid() : boolean {
    return AuthService.hasValidAccessToken();
}
}
