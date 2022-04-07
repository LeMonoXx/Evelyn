import { Component, OnInit } from '@angular/core';
import { EsiDataRepositoryService } from '../repositories/esi-data-repository.service';
import { EveMarketerDataRepositoryService } from '../repositories/evemarketer-data-repository.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(public esiDataService: EsiDataRepositoryService,
    public eveMarketerDataService: EveMarketerDataRepositoryService ) { }

  ngOnInit(): void {
  }
}
