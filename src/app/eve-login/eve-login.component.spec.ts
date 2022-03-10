import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EveLoginComponent } from './eve-login.component';

describe('EveLoginComponent', () => {
  let component: EveLoginComponent;
  let fixture: ComponentFixture<EveLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EveLoginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EveLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
