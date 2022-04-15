import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StationOrderStatusComponent } from './station-order-status.component';

describe('StationOrderStatusComponent', () => {
  let component: StationOrderStatusComponent;
  let fixture: ComponentFixture<StationOrderStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StationOrderStatusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StationOrderStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
