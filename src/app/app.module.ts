import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
registerLocaleData(localeDe, 'de-DE', localeDeExtra);

import { DEFAULT_CURRENCY_CODE, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { HttpClientModule } from '@angular/common/http';
import { EveLoginComponent } from './eve-login/eve-login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatDividerModule} from '@angular/material/divider';

import { AuthComponent } from './auth/auth.component';
import { httpInterceptorProviders } from './http-interceptors';
import { CharacterService } from './character.service';
import { EsiDataRepositoryService } from './repositories/esi-data-repository.service';
import { EveSearchComponent } from './eve-search/eve-search.component';
import { EveMarketerDataRepositoryService as EveMarketerDataRepositoryService } from './repositories/evemarketer-data-repository.service';
import { ItemStationPriceComponent } from './market/item-station-price/item-station-price.component';
import { ItemSearchService, MarketService, UniverseService } from './shared';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    EveLoginComponent,
    AuthComponent,
    EveSearchComponent,
    ItemStationPriceComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    
    FormsModule,
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
    MatAutocompleteModule
  ],
  providers: [
    httpInterceptorProviders,
    EsiDataRepositoryService,
    EveMarketerDataRepositoryService,
    CharacterService,
    ItemSearchService,
    MarketService,
    UniverseService,
    { provide: LOCALE_ID, useValue: 'de-DE' }, // this is needed to have the currency symbol on the right side
    {provide: DEFAULT_CURRENCY_CODE, useValue: 'ISK'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
