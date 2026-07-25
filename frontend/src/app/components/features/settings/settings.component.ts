import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AutoSelectDirective } from '../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../directives/form-state.directive';
import { NotificationService } from '../../../services/notification.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../translate.service';
import { ApiService } from '../../../api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, AutoSelectDirective, FormStateDirective],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @Input() currentLang: string = 'en';
  @Input() activeTab: string = 'settings';
  @Input() loggedInUser: any = null;
  @Input() usersList: any[] = [];
  @Input() settingsList: any[] = [];
  @Input() backupsList: any[] = [];
  @Input() isDarkMode: boolean = false;

  @Output() toggleTheme = new EventEmitter<boolean>();
  @Output() reloadData = new EventEmitter<void>();

  userForm = { username: '', password: '', role: 'OPERATOR', name: '', email: '' };
  settingsSearchQuery = '';

  constructor(private apiService: ApiService, private notificationService: NotificationService) {}

  ngOnInit() {}

  get filteredSettings(): any[] {
    const q = (this.settingsSearchQuery || '').trim().toLowerCase();
    if (!q) return this.settingsList;
    return this.settingsList.filter(s => 
      s.key.toLowerCase().includes(q) ||
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }

  get aiRecommendation(): string {
    const q = (this.settingsSearchQuery || '').trim().toLowerCase();
    if (!q) {
      return "💡 AI Tip: You can adjust the failed login lockout threshold in Security Settings.";
    }
    if (q.includes('tax') || q.includes('gst')) {
      return "💡 AI Suggestion: Optimize your CGST/SGST settings under the Tax & GST Category.";
    }
    if (q.includes('backup') || q.includes('db') || q.includes('database')) {
      return "💡 AI Suggestion: Automate database backups to AWS S3 weekly under the Database Category.";
    }
    if (q.includes('security') || q.includes('lock') || q.includes('otp')) {
      return "💡 AI Suggestion: Ensure OTP Verification is enabled to secure accountant login sessions.";
    }
    if (q.includes('ai') || q.includes('forecast') || q.includes('predict')) {
      return "💡 AI Suggestion: Enable AI Predictor to anticipate material shortfalls based on current inventory.";
    }
    if (q.includes('color') || q.includes('theme') || q.includes('dark')) {
      return "💡 AI Suggestion: Toggle 'Dark Mode Enabled' or modify brand colors to update the global dashboard styling.";
    }
    return `💡 AI Suggestion: Modifying settings in the '${this.filteredSettings[0]?.category || 'General'}' category may impact ERP automation. Please review carefully.`;
  }

  toggleDarkMode(val?: boolean) {
    this.toggleTheme.emit(val);
  }

  isViewer() {
    return this.loggedInUser && this.loggedInUser.role === 'VIEWER';
  }

  validateForm(formType: string): boolean {
    if (formType === 'user') {
      const f = this.userForm;
      if (!f.username.trim() || !f.name.trim() || !f.email.trim()) {
        this.notificationService.warning('Invalid Input', 'Please fill out all required fields.');
        return false;
      }
      if (!f.password.trim()) { this.notificationService.warning('Invalid Input', 'Password is required.'); return false; }
      if (f.password.length < 8) { this.notificationService.warning('Invalid Input', 'Password must be at least 8 characters long.'); return false; }
    }
    return true;
  }

  saveUser() {
    if (!this.validateForm('user')) return;
    this.apiService.createUser(this.userForm).subscribe({
      next: (res) => {
        if (res) this.usersList.unshift(res);
        this.reloadData.emit();
        this.notificationService.success('Data Added', 'User account created successfully');
        this.logAudit('Created user account: ' + this.userForm.username);
        this.userForm = { username: '', password: '', role: 'OPERATOR', name: '', email: '' };
      },
      error: (err) => {
        if (err.status === 409) {
          this.notificationService.error('Conflict', err.error?.message || 'A user with this username or email already exists.');
        } else {
          this.notificationService.error('Error', 'Failed to register user: ' + (err.error?.message || err.message));
        }
      }
    });
  }

  updateUserRole(username: string, newRole: string) {
    if (this.isViewer()) return;
    this.apiService.updateUser(username, { role: newRole }).subscribe({
      next: () => {
        const u = this.usersList.find(x => x.username === username);
        if (u) u.role = newRole;
      },
      error: err => console.error('Error updating role', err)
    });
  }

  updateUserEmail(username: string, newEmail: string) {
    if (this.isViewer()) return;
    this.apiService.updateUser(username, { email: newEmail }).subscribe({
      next: () => {
        const u = this.usersList.find(x => x.username === username);
        if (u) u.email = newEmail;
        this.notificationService.success('Success', 'Email updated successfully!');
      },
      error: err => {
        console.error('Error updating email', err);
        this.notificationService.error('Error', 'Failed to update email.');
      }
    });
  }

  toggleUserLock(username: string, currentLock: boolean) {
    const newLock = !currentLock;
    this.apiService.updateUser(username, { accountLocked: newLock }).subscribe(() => {
      this.reloadData.emit();
      this.logAudit((newLock ? 'Locked' : 'Unlocked') + ' user account: ' + username);
    });
  }

  deleteUser(username: string) {
    this.notificationService.confirmAction('Confirm Delete', 'Are you sure you want to delete user account ' + username + '?', 'Yes, Delete').then(confirmed => {
      if (confirmed) {
        this.apiService.deleteUser(username).subscribe({
          next: () => {
            this.usersList = this.usersList.filter(x => x.username !== username);
            this.reloadData.emit();
            this.notificationService.success('Deleted', 'User account deleted successfully');
            this.logAudit('Deleted user account: ' + username);
          },
          error: (err) => this.notificationService.error('Delete Failed', err.error?.message || err.message)
        });
      }
    });
  }

  getSettingVal(key: string): string {
    const s = this.settingsList.find(item => item.key === key);
    return s ? s.value : '';
  }

  setSettingVal(key: string, val: any) {
    const s = this.settingsList.find(item => item.key === key);
    if (s) {
      s.value = val;
      this.apiService.saveSetting(key, String(val)).subscribe();
    }
  }

  triggerBackup() {
    this.apiService.runBackup().subscribe({
      next: (res: any) => {
        this.notificationService.success('Backup Successful', res.message || 'Backup created successfully!');
        this.reloadData.emit();
      },
      error: (err) => {
        this.notificationService.error('Backup Failed', err.error?.message || err.message || err);
      }
    });
  }

  triggerRestore(filename: string) {
    this.notificationService.confirmAction('Confirm Restore', `Are you sure you want to restore the database from ${filename}? Current data will be overwritten!`, 'Yes, Restore').then(confirmed => {
      if (confirmed) {
        this.apiService.runRestore(filename).subscribe({
          next: (res: any) => {
            this.notificationService.success('Restore Successful', res.message || 'Database restored successfully!');
            this.reloadData.emit();
          },
          error: (err) => {
            this.notificationService.error('Restore Failed', err.error?.message || err.message || err);
          }
        });
      }
    });
  }

  logAudit(action: string) {
    if (this.loggedInUser) {
      this.apiService.createAuditLog({ username: this.loggedInUser.username, action }).subscribe();
    }
  }
}
