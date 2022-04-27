import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { IndustryService } from '../shared';

@Component({
  selector: 'app-production',
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.scss']
})
export class ProductionComponent implements OnInit {
  public BpoDetailsObs: Observable<any>;

  constructor(private industryService: IndustryService) { }

  ngOnInit(): void {

    this.BpoDetailsObs = this.industryService.getBlueprintDetails(22545);
  }

}
