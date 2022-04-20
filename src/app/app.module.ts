import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
registerLocaleData(localeDe, 'de-DE', localeDeExtra);

import { DEFAULT_CURRENCY_CODE, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from './header/header.component';
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
import { MatSidenavModule } from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';

import { httpInterceptorProviders } from './http-interceptors';
import { EveSearchComponent } from './eve-search/eve-search.component';
import { ItemStationPriceComponent } from './market/item-station-price/item-station-price.component';
import { SharedModule } from './shared/shared.module';
import { ProductionModule } from './production/production.module';
import { StationToStationTradeComponent } from './station-to-station-trade/station-to-station-trade.component';
import { AuthModule } from './auth/auth.module';
import { StationOrderStatusComponent } from './market/station-order-status/station-order-status.component';
import { ShoppingListComponent } from './market/shopping-list/shopping-list.component';

@NgModule({
  declarations: [
    AppComponent,
    StationToStationTradeComponent,
    EveSearchComponent,
    ItemStationPriceComponent,
    HeaderComponent,
    StationOrderStatusComponent,
    ShoppingListComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    
    SharedModule,
    ProductionModule,
    AuthModule,
    
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
    MatAutocompleteModule,
    MatSidenavModule,
    MatListModule
  ],
  providers: [
    httpInterceptorProviders,
    { provide: LOCALE_ID, useValue: 'de-DE' }, // this is needed to have the currency symbol on the right side
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'ISK' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
