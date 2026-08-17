import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isUat: boolean = environment.uat;
  isProd: boolean = environment.production && !environment.uat;
  @Input() isProduction: boolean = true;
  @Input() loggedInUser: any = null;
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = '';
  @Input() currentDateTimeString: string = '';
  @Input() sessionDuration: string = '';
  @Input() logoutCountdown: string = '';
  @Input() customBackendUrl: string = '';
  @Input() partiesList: any[] = [];
  @Input() employeesList: any[] = [];
  @Input() salesList: any[] = [];
  @Input() dispatchesList: any[] = [];

  @Output() onToggleSidebar = new EventEmitter<void>();
  @Output() onLogout = new EventEmitter<void>();
  @Output() onSetLanguage = new EventEmitter<string>();
  @Output() onCustomBackendUrlChange = new EventEmitter<string>();
  @Output() onNavigateTab = new EventEmitter<string>();

  // Global Search State
  globalSearchQuery = '';
  globalSearchResults: any[] = [];

  doGlobalSearch() {
    if (!this.globalSearchQuery || this.globalSearchQuery.trim().length < 2) {
      this.globalSearchResults = [];
      return;
    }
    const q = this.globalSearchQuery.toLowerCase().trim();
    const results: any[] = [];

    (this.partiesList || []).filter(p => p.partyName?.toLowerCase().includes(q)).slice(0, 3).forEach(p => {
      results.push({ type: 'Party', label: p.partyName, detail: p.city || p.partyContact, tab: 'parties' });
    });

    (this.employeesList || []).filter(e => e.empName?.toLowerCase().includes(q)).slice(0, 3).forEach(e => {
      results.push({ type: 'Employee', label: e.empName, detail: e.designation || e.empContact, tab: 'employees' });
    });

    (this.salesList || []).filter(s => (s.party?.partyName?.toLowerCase().includes(q) || s.crateType?.toLowerCase().includes(q))).slice(0, 3).forEach(s => {
      results.push({ type: 'Sale', label: `${s.party?.partyName || 'Customer'} - ${s.crateType}`, detail: `₹${s.totalAmount}`, tab: 'sales' });
    });

    (this.dispatchesList || []).filter(d => (d.vehicleNumber?.toLowerCase().includes(q) || d.driverName?.toLowerCase().includes(q))).slice(0, 3).forEach(d => {
      results.push({ type: 'Dispatch', label: `${d.vehicleNumber} (${d.driverName || 'Driver'})`, detail: d.dispatchStatus, tab: 'dispatch' });
    });

    this.globalSearchResults = results.slice(0, 8);
  }

  goToSearchResult(result: any) {
    this.onNavigateTab.emit(result.tab);
    this.globalSearchResults = [];
    this.globalSearchQuery = '';
  }

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
