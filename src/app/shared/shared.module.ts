import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EsiDataRepositoryService, EveMarketerDataRepositoryService } from '../repositories';
import { CharacterService, ItemSearchService, MarketService, UniverseService } from './index';
import { AppCookieService } from '../app-cookie.service';

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
  ]
})
export class SharedModule { }
