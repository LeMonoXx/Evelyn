import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { ProductionComponent } from './production/index';
import { StationToStationTradeComponent } from './StationToStationTrade/station-to-station-trade.component';

const routes: Routes = [
  { path: '', redirectTo: 'StationToStationTrade', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'StationToStationTrade', component: StationToStationTradeComponent },
  { path: 'production', component: ProductionComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
