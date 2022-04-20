import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { AuthService, IAuthResponseData } from '../auth';
import { ItemDetails, StationDetails, StructureDetails } from '../models';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';
import { calculateTaxPercentBySkillLevel, CharacterService, ItemIdentifier, ItemSearchService, MarketService, UniverseService } from '../shared';

@Component({
  selector: 'app-station-to-station-trade',
  templateUrl: './station-to-station-trade.component.html',
  styleUrls: ['./station-to-station-trade.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StationToStationTradeComponent implements OnInit {

  public currentItemObs: Observable<ItemIdentifier>;
  public currentSellStationObs: Observable<StructureDetails>;
  public numberCountObs: Observable<number>;
  public itemDetailsObs: Observable<ItemDetails>;
  public currentBuyStationObs: Observable<StationDetails>;
  public authStatusObs: Observable<IAuthResponseData | null>;
  public characterSaleTaxPercentObs: Observable<number>;

  constructor(public esiDataService: EsiDataRepositoryService,
    public eveMarketerDataService: EveMarketerDataRepositoryService,
    public itemSearchService: ItemSearchService,
    public universeService: UniverseService,
    public marketService: MarketService,
    private authService: AuthService,
    private characterService: CharacterService ) {

      this.currentItemObs = this.itemSearchService.CurrentItemObs;
      this.numberCountObs = this.itemSearchService.ItemCountObs;
      this.itemDetailsObs = this.itemSearchService.CurrentItemDetailsObs;
      this.authStatusObs = this.authService.authObs;
     }

  ngOnInit(): void {
    
    this.currentSellStationObs = this.universeService.getStructureDetails(1038457641673);
    this.currentBuyStationObs = this.universeService.getStationDetails(60003760);
    this.characterSaleTaxPercentObs = this.characterService.getAuthenticatedCharacterInfo().pipe(
                                    switchMap(character => this.characterService.getCharacterSkills(character.CharacterID)),
                                    map(characterSkill => {
                                      const salesSkill = characterSkill.skills.find(skill => skill.skill_id === 16622);
                                      
                                      // default is 8% tax;
                                      let result = 8;
                                      if(salesSkill) {
                                        result = calculateTaxPercentBySkillLevel(salesSkill.active_skill_level);
                                      }

                                      return result;
                                    })
    )

  }
}
