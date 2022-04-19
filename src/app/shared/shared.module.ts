import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EsiDataRepositoryService, EveMarketerDataRepositoryService } from '../repositories';
import { CharacterService, FavoritesService, ItemSearchService, MarketService, ShoppingListService, UniverseService } from './index';
import { AppCookieService } from '../auth';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    AppCookieService,
    EsiDataRepositoryService,
    EveMarketerDataRepositoryService,
    CharacterService,
    ItemSearchService,
    MarketService,
    UniverseService,
    FavoritesService,
    ShoppingListService
  ]
})
export class SharedModule { }
