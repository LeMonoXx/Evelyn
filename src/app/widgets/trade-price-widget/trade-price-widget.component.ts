import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, switchMap, combineLatest, Observable } from 'rxjs';
import { ItemDetails } from 'src/app/models';
import { ACCOUNTING_SKILL_ID, calculateTaxPercentBySkillLevel, 
  CharacterService, copyToClipboard, getAllowedShippingServices, getTradeCalculation,
  ItemTradeFavorite, JITA_REGION_ID, MarketService, TradeCalculation, UniverseService } from 'src/app/shared';

@Component({
  selector: 'app-trade-price-widget',
  templateUrl: './trade-price-widget.component.html',
  styleUrls: ['./trade-price-widget.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TradePriceWidgetComponent implements OnInit {

  @Input()
  public inputItem: ItemTradeFavorite;
  public tradeDataObs: Observable<TradeCalculation>;
  public itemDetailsObs: Observable<ItemDetails>;

  constructor(
    private marketService: MarketService,
    private snackBar: MatSnackBar,
    private characterService: CharacterService,
    private universeService: UniverseService) { }

  ngOnInit(): void {
    const saleTaxPercentObs = this.characterService.getAuthenticatedCharacterInfo().pipe(
      switchMap(character => this.characterService.getCharacterSkills(character.CharacterID)),
      map(characterSkill => {
        const accountingSkill = characterSkill.skills.find(skill => skill.skill_id === ACCOUNTING_SKILL_ID);
        if(accountingSkill)
          return accountingSkill?.active_skill_level;

          else return 0;
      }),
      map(level => calculateTaxPercentBySkillLevel(level)));

    this.itemDetailsObs = this.universeService.getItemDetails(this.inputItem.type_id);

    const itemBuyCostObs =  this.marketService.getRegionMarketForItem(this.inputItem.type_id, JITA_REGION_ID).pipe(
          // we get the market for the whole region. But we only want the buyStation.
          map(entries => entries.filter(entry => entry.location_id === this.inputItem.buy_station))
        );
      
    const itemSellCostObs = this.marketService.getStructureMarketForItem(this.inputItem.sell_structure, this.inputItem.type_id, false);

    const shippingService = getAllowedShippingServices()[1];

    const buyStationObs = this.universeService.getStationDetails(this.inputItem.buy_station);

    const sellStructureObs = this.universeService.getStructureDetails(this.inputItem.sell_structure);

    this.tradeDataObs = 
    combineLatest([
        buyStationObs,
        sellStructureObs,
        itemBuyCostObs, 
        this.itemDetailsObs, 
        itemSellCostObs,
        saleTaxPercentObs
      ]).pipe(
        map(([
          buyStation,
          sellStructure,
          buyEntries, 
          itemDetails, 
          sellEntries,
          saleTaxPercent
          ]) => getTradeCalculation(
            buyStation,
            sellStructure,
            1, 
            buyEntries, 
            itemDetails, 
            sellEntries,
            saleTaxPercent,
            shippingService)
          )
        );
  } 

  public getImageForItem(typeId: number): string {
    return this.universeService.getImageUrlForType(typeId, 32);
  }

  public copy(text: string) {
    copyToClipboard(text);

    this.snackBar.open("Copied!", undefined, { duration: 2000 });
  }

}
