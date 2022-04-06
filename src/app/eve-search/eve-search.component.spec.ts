import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EveSearchComponent } from './eve-search.component';

describe('EveSearchComponent', () => {
  let component: EveSearchComponent;
  let fixture: ComponentFixture<EveSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EveSearchComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EveSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
