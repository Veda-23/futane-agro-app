import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../translate.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isSidebarOpen: boolean = false;
  @Input() loggedInUser: any = null;
  @Input() activeTab: string = 'dashboard';
  @Input() accessibleTabs: { [key: string]: boolean } = {};
  @Input() currentLang: string = 'en';

  @Output() onToggleSidebar = new EventEmitter<void>();
  @Output() onSwitchTab = new EventEmitter<string>();

  toggleSidebar() {
    this.onToggleSidebar.emit();
  }

  switchTab(tab: string) {
    this.onSwitchTab.emit(tab);
  }
}
