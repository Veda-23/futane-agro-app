import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-global-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-filter.component.html',
  styleUrls: ['./global-filter.component.css']
})
export class GlobalFilterComponent {
  @Input() filters: any = { query: '', date: '', month: '' };
  @Input() showFilters: boolean = false;

  @Output() filtersChange = new EventEmitter<any>();
  @Output() toggleVisibility = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();

  onFilterChange() {
    this.filtersChange.emit(this.filters);
  }
}
