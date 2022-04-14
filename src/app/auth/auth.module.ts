import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthComponent, AuthService } from '.';
import { AppCookieService } from './app-cookie.service';



@NgModule({
  declarations: [
    AuthComponent
  ],
  imports: [
    CommonModule
  ],
  providers: [
    AuthService,
    AppCookieService
  ]
})
export class AuthModule { }
