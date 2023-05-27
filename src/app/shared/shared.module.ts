import { CommonModule } from '@angular/common';
import { EsiDataRepositoryService, EveMarketerDataRepositoryService } from '../repositories';
import { CharacterService, FavoritesService, IndustryService, ItemSearchService, MarketService, ShoppingListService, UniverseService } from './index';
import { AppCookieService } from '../auth';
import { EveSearchComponent } from '../eve-search/eve-search.component';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { AutocompleteService } from '../repositories/autocomplete.service';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    EveSearchComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatSidenavModule,
    MatListModule,
    MatSnackBarModule,
    MatSelectModule,
    MatBadgeModule,
  ],
  providers: [
    AppCookieService,
    AutocompleteService,
    EsiDataRepositoryService,
    EveMarketerDataRepositoryService,
    CharacterService,
    ItemSearchService,
    MarketService,
    UniverseService,
    FavoritesService,
    ShoppingListService,
    IndustryService
  ],
  exports: [
    CommonModule,
    FormsModule,

    EveSearchComponent,
    ReactiveFormsModule,
    MatDividerModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatSidenavModule,
    MatListModule,
    MatSnackBarModule,
    MatSelectModule,
    MatBadgeModule
  ]
})
export class SharedModule { }
