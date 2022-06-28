import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductionComponent } from './production/index';
import { ShippingCalculatorComponent } from './shipping';
import { StationToStationTradeComponent } from './station-to-station-trade/station-to-station-trade.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'trade', component: StationToStationTradeComponent },
  { path: 'production', component: ProductionComponent },
  { path: 'shipping', component: ShippingCalculatorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
