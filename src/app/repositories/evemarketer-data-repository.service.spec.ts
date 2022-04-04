import { TestBed } from '@angular/core/testing';

import { EvemarketerDataRepositoryService } from './evemarketer-data-repository.service';

describe('EvemarketerDataRepositoryService', () => {
  let service: EvemarketerDataRepositoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EvemarketerDataRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
