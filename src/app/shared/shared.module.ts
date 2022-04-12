import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EsiDataRepositoryService, EveMarketerDataRepositoryService } from '../repositories';
import { CharacterService, ItemSearchService, MarketService, UniverseService } from './index';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    EsiDataRepositoryService,
    EveMarketerDataRepositoryService,
    CharacterService,
    ItemSearchService,
    MarketService,
    UniverseService,
  ]
})
export class SharedModule { }
