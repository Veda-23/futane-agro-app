import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  @Input() icon: string = 'bi-inbox';
  @Input() title: string = 'No Data Found';
  @Input() description: string = '';
  @Input() actionLabel: string = '';
  @Input() actionIcon: string = '';
  @Input() variant: 'default' | 'error' | 'warning' | 'info' | 'search' = 'default';
  @Input() compact: boolean = false;

  @Output() action = new EventEmitter<void>();

  onActionClick() {
    this.action.emit();
  }
}
