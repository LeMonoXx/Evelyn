import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemStationPriceComponent } from './item-station-price.component';

describe('ItemStationPriceComponent', () => {
  let component: ItemStationPriceComponent;
  let fixture: ComponentFixture<ItemStationPriceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ItemStationPriceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemStationPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
