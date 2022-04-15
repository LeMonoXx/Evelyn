import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, mergeMap, Observable } from 'rxjs';
import { MarketOrder, StructureDetails } from 'src/app/models';
import { CharacterService, MarketService } from 'src/app/shared';

@Component({
  selector: 'app-station-order-status',
  templateUrl: './station-order-status.component.html',
  styleUrls: ['./station-order-status.component.scss']
})
export class StationOrderStatusComponent implements OnInit {

  @Input()
  public structure$ : Observable<StructureDetails>;
  
  public characterOrdersObs: Observable<MarketOrder[]>;

  constructor(private marketService: MarketService,
    private characterService: CharacterService) { }

  ngOnInit(): void {

    const characterObs = this.characterService.getAuthenticatedCharacterInfo();

    this.characterOrdersObs = combineLatest([characterObs, this.structure$]).pipe(
      mergeMap(([character, structure]) => this.marketService.getMarketOrders(structure.evelyn_structureId, character.CharacterID))
    )
  }

}
