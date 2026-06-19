import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() isProduction: boolean = true;
  @Input() loggedInUser: any = null;
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = '';
  @Input() currentDateTimeString: string = '';
  @Input() sessionDuration: string = '';
  @Input() logoutCountdown: string = '';
  @Input() customBackendUrl: string = '';

  @Output() onToggleSidebar = new EventEmitter<void>();
  @Output() onLogout = new EventEmitter<void>();
  @Output() onSetLanguage = new EventEmitter<string>();
  @Output() onCustomBackendUrlChange = new EventEmitter<string>();

  toggleSidebar() {
    this.onToggleSidebar.emit();
  }

  handleLogout() {
    this.onLogout.emit();
  }

  setLanguage(lang: string) {
    this.onSetLanguage.emit(lang);
  }

  saveBackendUrl() {
    this.onCustomBackendUrlChange.emit(this.customBackendUrl);
  }
}
