import { Component, OnInit } from '@angular/core';

  // Url des Authorization-Servers
  export const issuer: 'https://login.eveonline.com/v2/oauth/authorize/';
  
  export const tokenEndpoint: 'https://login.eveonline.com/v2/oauth/token';

@Component({
  selector: 'app-eve-login',
  templateUrl: './eve-login.component.html',
  styleUrls: ['./eve-login.component.scss']
})
export class EveLoginComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {

  }

  startLogin(): void {
    console.log("startLogin started");
  }
}
