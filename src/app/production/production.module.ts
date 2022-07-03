import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductionComponent } from './production.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { BlueprintMaterialsComponent } from '.';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from '../app-routing.module';
import { BlueprintDetailsComponent } from './blueprint-details/blueprint-details.component';
import { SubBlueprintsComponent } from './sub-blueprints/sub-blueprints.component';
import { BlueprintMaterialCostsComponent } from './blueprint-material-costs/blueprint-material-costs.component';

@NgModule({
  declarations: [
  ],
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    
    SharedModule,
  ]
})
export class ProductionModule { }
