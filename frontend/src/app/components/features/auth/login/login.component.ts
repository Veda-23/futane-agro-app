import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { AutoSelectDirective } from '../../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../../directives/form-state.directive';
import { NotificationService } from '../../../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../api.service';

import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoSelectDirective, FormStateDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnDestroy {
  isUat: boolean = environment.uat;
  isProd: boolean = environment.production && !environment.uat;
  @Input() currentLang: string = 'en';
  @Output() onLoginSuccess = new EventEmitter<any>();
  @Output() onSetLanguage = new EventEmitter<string>();

  loginError = '';
  loginCredentials = { username: '', password: '' };

  // OTP Login Flow State
  showOtpScreen = false;
  otpValue = '';
  tempOtp = '';
  otpCountdown = 120;
  otpTimerInterval: any = null;
  showPassword = false;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  forgotPassword() {
    this.notificationService.showWarning('Password Reset', 'Please contact the system administrator to reset your password.');
  }

  fillCredentials(username: string, password: string, autoSubmit = false) {
    this.loginCredentials = { username, password };
    this.loginError = '';
    if (autoSubmit) {
      this.handleLogin();
    }
  }

  handleLogin() {
    this.loginError = '';
    // Clear any obsolete legacy backend URL from older versions
    const saved = localStorage.getItem('backend_url');
    if (saved && saved.includes(':8080')) {
      localStorage.removeItem('backend_url');
    }

    this.apiService.login(this.loginCredentials).subscribe({
      next: (res) => {
        if (res.status === 'OTP_REQUIRED' || res.status === 'OTP_SENT') {
          this.showOtpScreen = true;
          this.tempOtp = res.tempOtp || '';
          this.otpValue = this.tempOtp; // Auto-fill 6-digit OTP in UAT/Test environment
          this.startOtpTimer();
          if (this.tempOtp) {
            setTimeout(() => this.verifyOtp(), 250);
          }
        } else if (res.token) {
          this.completeLoginLocal(res);
        } else {
          this.loginError = 'Unexpected login response. Please try again.';
        }
      },
      error: (err) => {
        console.error('Login request failed:', err);
        if (err.status === 0) {
          this.loginError = 'Cannot reach ERP backend server. Please verify backend is running on port 8082 (UAT) / 8081 and refresh.';
        } else if (err.status === 423 || err.status === 403) {
          this.loginError = err.error?.message || 'Account is locked due to multiple failed attempts. Please wait 30 minutes.';
        } else if (err.status === 429) {
          this.loginError = err.error?.message || 'Too many login attempts. Please wait 60 seconds.';
        } else if (err.status === 401) {
          this.loginError = err.error?.message || 'Invalid username or password.';
        } else {
          this.loginError = err.error?.message || `Server error (${err.status}): ${err.statusText || 'Please try again'}`;
        }
      }
    });
  }

  startOtpTimer() {
    this.clearOtpTimer();
    this.otpCountdown = 120;
    this.otpTimerInterval = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
      } else {
        this.clearOtpTimer();
        this.loginError = 'OTP has expired. Please request a new one.';
      }
    }, 1000);
  }

  clearOtpTimer() {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  }

  formatCountdown(): string {
    const minutes = Math.floor(this.otpCountdown / 60);
    const seconds = this.otpCountdown % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  verifyOtp() {
    this.loginError = '';
    this.apiService.verifyOtp({
      username: this.loginCredentials.username,
      otp: this.otpValue
    }).subscribe({
      next: (res) => {
        this.completeLoginLocal(res);
      },
      error: (err) => {
        console.error('OTP verification failed:', err);
        if (err.status === 0) {
          this.loginError = 'Cannot reach ERP backend server. Please check your connection.';
        } else if (err.status === 429) {
          this.loginError = err.error?.message || 'Too many verification attempts. Please wait 60 seconds.';
        } else {
          this.loginError = err.error?.message || 'Invalid or expired OTP.';
        }
      }
    });
  }

  resendOtp() {
    this.handleLogin();
  }

  backToLogin() {
    this.showOtpScreen = false;
    this.otpValue = '';
    this.tempOtp = '';
    this.loginError = '';
    this.loginCredentials.password = '';
    this.clearOtpTimer();
  }

  completeLoginLocal(res: any) {
    this.showOtpScreen = false;
    this.otpValue = '';
    this.tempOtp = '';
    this.clearOtpTimer();
    this.onLoginSuccess.emit(res);
  }

  setLanguage(lang: string) {
    this.onSetLanguage.emit(lang);
  }

  ngOnDestroy() {
    this.clearOtpTimer();
  }
}
