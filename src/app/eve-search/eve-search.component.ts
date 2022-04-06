import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-eve-search',
  templateUrl: './eve-search.component.html',
  styleUrls: ['./eve-search.component.scss']
})
export class EveSearchComponent implements OnInit {

  myControl = new FormControl();
  options: string[] = ['Hulk', 'Small Skill Injector', 'Three'];

  constructor() { }

  ngOnInit(): void {
  }

}
