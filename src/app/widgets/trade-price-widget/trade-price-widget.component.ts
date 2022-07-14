import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { map, switchMap, combineLatest, Observable } from 'rxjs';
import { ItemDetails } from 'src/app/models';
import { ACCOUNTING_SKILL_ID, calculateTaxPercentBySkillLevel, 
  CharacterService, copyToClipboard, GetShippingRoute, getShippingServices, getTradeCalculation,
  ItemSearchService,
  ItemTradeFavorite, MarketService, TradeCalculation, UniverseService } from 'src/app/shared';

@Component({
  selector: 'app-trade-price-widget',
  templateUrl: './trade-price-widget.component.html',
  styleUrls: ['./trade-price-widget.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TradePriceWidgetComponent implements OnInit {

  @Input()
  public inputTradeFavorite: ItemTradeFavorite;

  public tradeDataObs: Observable<TradeCalculation>;
  public itemDetailsObs: Observable<ItemDetails>;

  constructor(
    private searchService: ItemSearchService,
    private router: Router,
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

    this.itemDetailsObs = this.universeService.getItemDetails(this.inputTradeFavorite.type_id);

    const shippingService = getShippingServices()[1];

    const itemBuyCostObs = this.marketService.getMarketEntries(this.inputTradeFavorite.type_id, this.inputTradeFavorite.buy_station, false).pipe( 
      // we get the market for the whole region. But we only want the startStation.
      map(entries => entries.filter(entry => entry.location_id === this.inputTradeFavorite.buy_station.station_Id))
      );
      
    const itemSellCostObs = this.marketService.getMarketEntries(this.inputTradeFavorite.type_id, this.inputTradeFavorite.sell_station, false);

    this.tradeDataObs = 
    combineLatest([
        itemBuyCostObs, 
        this.itemDetailsObs, 
        itemSellCostObs,
        saleTaxPercentObs
      ]).pipe(
        map(([
          buyEntries, 
          itemDetails, 
          sellEntries,
          saleTaxPercent
          ]) => {
            const route = GetShippingRoute(shippingService, this.inputTradeFavorite.buy_station, this.inputTradeFavorite.sell_station);
            return getTradeCalculation(
              this.inputTradeFavorite.buy_station, 
              this.inputTradeFavorite.sell_station,
              1, 
              buyEntries, 
              itemDetails, 
              sellEntries,
              saleTaxPercent,
              route);
          } 
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

  public navigate(type_id: number) {
    this.searchService.setCurrentItem(({ id: type_id }))
    this.router.navigate(['/trade'])
  }

}
