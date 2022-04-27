// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  clientID: 'ce8fa705b7794e968dcff5331db42e9f',
  esiBaseUrl: 'https://esi.evetech.net/latest',
  eveMarketerBaseUrl: 'https://evemarketer.com/api/v1',
  sdeBaseUrl: 'https://eve-sde.monoxnet.de',
  esiVerifyUrl: 'https://esi.evetech.net/verify/',
  production: false,
  ssoCallbackURL: 'http://localhost:4200/auth/',
  version: '1.0.0-dev'
};

/*
* For easier debugging in development mode, you can import the following file
* to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
*
* This import should be commented out in production mode because it will have a negative impact
* on performance if an error is thrown.
*/
import 'zone.js/dist/zone-error';  // Included with Angular CLI.