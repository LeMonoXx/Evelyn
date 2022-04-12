import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StationToStationTradeComponent } from './station-to-station-trade.component';

describe('DashboardComponent', () => {
  let component: StationToStationTradeComponent;
  let fixture: ComponentFixture<StationToStationTradeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StationToStationTradeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StationToStationTradeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
