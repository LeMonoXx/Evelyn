import { TestBed } from '@angular/core/testing';

import { EveMarketerDataRepositoryService } from './evemarketer-data-repository.service';

describe('EvemarketerDataRepositoryService', () => {
  let service: EveMarketerDataRepositoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EveMarketerDataRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
