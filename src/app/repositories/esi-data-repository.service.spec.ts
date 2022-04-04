import { TestBed } from '@angular/core/testing';

import { EsiDataRepositoryService } from './esi-data-repository.service';

describe('EsiDataRepositoryService', () => {
  let service: EsiDataRepositoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EsiDataRepositoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
