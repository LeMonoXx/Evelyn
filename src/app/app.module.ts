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

import { httpInterceptorProviders } from './http-interceptors';
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
import { BlueprintDetailsComponent, BlueprintManufacturingComponent, ProductionComponent } from './production';

@NgModule({
  declarations: [
    AppComponent,
    StationToStationTradeComponent,
    ItemStationPriceComponent,
    HeaderComponent,
    StationOrderStatusComponent,
    ShoppingListComponent,
    ItemHistoryComponent,
    TradePriceWidgetComponent, 
    ProductionComponent,
    BlueprintManufacturingComponent,
    BlueprintDetailsComponent
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
