import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../translate.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() isSidebarOpen: boolean = false;
  @Input() isCollapsed: boolean = false;
  @Input() loggedInUser: any = null;
  @Input() activeTab: string = 'dashboard';
  @Input() accessibleTabs: { [key: string]: boolean } = {};
  @Input() currentLang: string = 'en';

  @Output() onToggleSidebar = new EventEmitter<void>();
  @Output() onToggleCollapse = new EventEmitter<void>();
  @Output() onSwitchTab = new EventEmitter<string>();

  showUserCard: boolean = true;
  collapsedSections: { [key: string]: boolean } = {};

  ngOnInit() {
    const savedCardState = localStorage.getItem('sidebar_user_card_visible');
    if (savedCardState !== null) {
      this.showUserCard = savedCardState === 'true';
    }
  }

  toggleSidebar() {
    this.onToggleSidebar.emit();
  }

  toggleCollapse() {
    this.onToggleCollapse.emit();
  }

  switchTab(tab: string) {
    this.onSwitchTab.emit(tab);
  }

  toggleUserCard() {
    this.showUserCard = !this.showUserCard;
    localStorage.setItem('sidebar_user_card_visible', this.showUserCard ? 'true' : 'false');
  }

  toggleSection(sectionKey: string) {
    this.collapsedSections[sectionKey] = !this.collapsedSections[sectionKey];
  }
}
