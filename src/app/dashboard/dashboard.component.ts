import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { ItemDetails, StationDetails, StructureDetails } from '../models';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';
import { ItemIdentifier, ItemSearchService, MarketService, UniverseService } from '../shared';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {

  public currentItemObs: Observable<ItemIdentifier>;
  public currentSellStationObs: Observable<StructureDetails>;
  public numberCountObs: Observable<number>;
  public itemDetailsObs: Observable<ItemDetails>;
  public currentBuyStationObs: Observable<StationDetails>;

  constructor(public esiDataService: EsiDataRepositoryService,
    public eveMarketerDataService: EveMarketerDataRepositoryService,
    public itemSearchService: ItemSearchService,
    public universeService: UniverseService,
    public marketService: MarketService) {

      this.currentItemObs = this.itemSearchService.CurrentItemObs;
      this.numberCountObs = this.itemSearchService.ItemCountObs;
      this.itemDetailsObs = this.itemSearchService.CurrentItemDetailsObs;
     }

  ngOnInit(): void {
    
    this.currentSellStationObs = this.universeService.getStructureDetails(1038457641673);
    this.currentBuyStationObs = this.universeService.getStationDetails(60003760);            
  }

  public get authValid() : boolean {
    return AuthService.hasValidAccessToken();
}
}
