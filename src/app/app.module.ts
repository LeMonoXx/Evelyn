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

import {MatBadgeModule} from '@angular/material/badge'
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
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSelectModule} from '@angular/material/select';

import { httpInterceptorProviders } from './http-interceptors';
import { EveSearchComponent } from './eve-search/eve-search.component';
import { ItemStationPriceComponent } from './market/item-station-price/item-station-price.component';
import { SharedModule } from './shared/shared.module';
import { ProductionModule } from './production/production.module';
import { StationToStationTradeComponent } from './station-to-station-trade/station-to-station-trade.component';
import { AuthModule } from './auth/auth.module';
import { StationOrderStatusComponent } from './market/station-order-status/station-order-status.component';
import { ShoppingListComponent } from './market/shopping-list/shopping-list.component';
import { ItemHistoryComponent } from './market/item-history/item-history.component';

import { LegendService, TooltipService, AreaSeriesService, ScatterSeriesService, BarSeriesService,
  ColumnSeriesService, MultiLevelLabelService, SelectionService  } from '@syncfusion/ej2-angular-charts';
import { ChartModule, DataLabelService, LineSeriesService, CategoryService, ZoomService,
 DateTimeService, DateTimeCategoryService, StripLineService, SplineSeriesService,
 TrendlinesService } from '@syncfusion/ej2-angular-charts';
import { TradePriceWidgetComponent } from './widgets/trade-price-widget/trade-price-widget.component';

@NgModule({
  declarations: [
    AppComponent,
    StationToStationTradeComponent,
    ItemStationPriceComponent,
    HeaderComponent,
    StationOrderStatusComponent,
    ShoppingListComponent,
    ItemHistoryComponent,
    TradePriceWidgetComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    
    SharedModule,
    AuthModule,
    ChartModule
  ],
  providers: [
    httpInterceptorProviders,
    { provide: LOCALE_ID, useValue: 'de-DE' }, // this is needed to have the currency symbol on the right side
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'ISK' },
    CategoryService, LegendService, TooltipService, DataLabelService, LineSeriesService,
    DateTimeService, DateTimeCategoryService , StripLineService, SplineSeriesService, ZoomService,
    TrendlinesService, AreaSeriesService, ScatterSeriesService,
    BarSeriesService, ColumnSeriesService, MultiLevelLabelService, SelectionService
  ],
  exports: [
    SharedModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
