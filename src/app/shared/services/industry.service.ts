import { Injectable } from '@angular/core';
import { from, map, Observable, of, shareReplay, tap } from 'rxjs';
import { BlueprintDetails as BlueprintDetails } from 'src/app/models';
import { EsiDataRepositoryService } from 'src/app/repositories';
import { environment } from 'src/environments/environment';
import { parse } from 'yaml'
import { getStoredBlueprintDetails, storeBlueprintDetails } from '../functions/storage';

@Injectable({
  providedIn: 'root'
})
export class IndustryService {

  constructor(private esiDataService: EsiDataRepositoryService) { }

  public getBlueprintDetails(type_id: number) : Observable<BlueprintDetails> {

    const storedDetails = getStoredBlueprintDetails(); 

    if(storedDetails) {
      return of(storedDetails[type_id]);
    }

    return this.getAllBlueprints().pipe(
      map(yamlObject => yamlObject[type_id])
    );
  }
  
  public getAllBlueprints(): Observable<{ [typeId: number]: BlueprintDetails }> {
    const url = environment.sdeBaseUrl + `/fsd/blueprints.yaml`
    return this.esiDataService.getText(url).pipe(
      map(text => parse(text) as { [typeId: number]: BlueprintDetails }),
      // add all blueprint-details to the storage for later usage
      tap(bpod => storeBlueprintDetails(bpod)),
      shareReplay(1)
    );
  }
}
