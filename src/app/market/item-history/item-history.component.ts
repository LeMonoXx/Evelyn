import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { combineLatest, debounceTime, map, Observable, switchMap, tap } from 'rxjs';
import { MarketHistory } from 'src/app/models';
import * as moment from 'moment';
import { ItemIdentifier, MarketService } from 'src/app/shared';

@Component({
  selector: 'app-item-history',
  templateUrl: './item-history.component.html',
  styleUrls: ['./item-history.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ItemHistoryComponent implements OnInit {
  public border: Object;
  public chartArea: Object = {
    border: { width : 0}
  };

  public primaryXAxis: Object;
  
  public primaryYAxis = {
    title: 'Average',
    valueType: 'Double',
    labelFormat: '{value} ISK',
    minimum: 1,
 //   maximum: 100,
    interval: 1000000,
    titleStyle: {
      size: '16px',
     },
     labelStyle: {
      size: '14px'
     },
  };

  public margin = { left: 0, right: 0, top: 0, bottom: 0 };

  @Input()
  public itemIdentifier$: Observable<ItemIdentifier>;

  @Input()
  public region$: Observable<number>;

  public historyDataObs: Observable<MarketHistory[]>;

  constructor(
    private marketService: MarketService
  ) { }

  ngOnInit(): void {
    this.border = { width: 0 };
    
    const endDate = new Date();
    const startDate = moment(endDate).subtract(25, 'days').startOf('day').toDate();
    
    this.primaryXAxis =  {
      valueType: 'DateTime',
      title: 'Datum',
      intervalType: 'Days',
      interval: 1,
      labelFormat: 'dd.MM.',
      minimum: startDate,
      maximum: endDate,
      labelIntersectAction: 'Rotate45',
      edgeLabelPlacement: 'Shift'
    };

    this.historyDataObs = combineLatest([this.itemIdentifier$, this.region$]).pipe(
      debounceTime(250),
      switchMap(([item, region]) => this.marketService.getHistoricalDataForItem(item.id, region)),
      map(entries => {

        const filtered = entries.filter(entry => entry.evelyn_date >= startDate);
        
        let minValue = Number.MAX_VALUE;
        let maxValue = 0;
        let interval = 1;
        filtered.forEach(entry => {
          if(entry.average < minValue) {
            minValue = Math.round(entry.average);
          }

          if(entry.average > maxValue) {
            maxValue = Math.round(entry.average);
          }
        });

        this.primaryYAxis.minimum = this.calcMinValue(minValue);
      //  this.primaryYAxis.maximum = roundedNumber;
        this.primaryYAxis.interval = this.calcInterval(Math.round(maxValue - minValue));

        return filtered;
      }))
  }

  private calcMinValue(input: number): number
  {
    console.log("calcMinValue for ", input);
    let stringNumber: string = input.toString()[0];

    for(let i = 2; i <= input.toString().length; i++) {
      stringNumber += "0";
    }
    console.log("calcMinValue result ", stringNumber);
    return Number(stringNumber); 
   }

   private calcInterval(input: number): number
   {
    console.log("calcInterval for ", input);
     let stringNumber: string = input.toString()[0];
 
     for(let i = 2; i <= input.toString().length; i++) {
       stringNumber += "0";
     }
     console.log("calcInterval result ", stringNumber);
     return Number(stringNumber); 
    }

}
