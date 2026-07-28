import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
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

  // Futuristic Notification Hub State
  showNotifDropdown = false;
  notifications = [
    { id: 1, title: 'Low Inventory Alert', desc: 'Raw material "Fly Ash" is running low (11.8% remaining)', time: '8 mins ago', type: 'warning', read: false },
    { id: 2, title: 'Invoice Dispatched', desc: 'Invoice #INV-2026-042 (₹1,84,500) successfully sent to Client', time: '22 mins ago', type: 'success', read: false },
    { id: 3, title: 'System Security Audit', desc: 'Secure session validated for admin profile from IP 80.225.192.171', time: '1 hour ago', type: 'info', read: true },
    { id: 4, title: 'Automated DB Backup', desc: 'System state database backup archived and verified', time: '4 hours ago', type: 'success', read: true }
  ];

  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showNotifDropdown = false;
    }
  }

  get unreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  toggleNotifDropdown() {
    this.showNotifDropdown = !this.showNotifDropdown;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
  }

  clearNotification(id: number, event: Event) {
    event.stopPropagation();
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

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
