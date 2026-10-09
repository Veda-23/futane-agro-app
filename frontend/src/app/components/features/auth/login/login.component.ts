import { Component, OnInit, EventEmitter, Input, Output, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoSelectDirective } from '../../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../../directives/form-state.directive';
import { NotificationService } from '../../../../services/notification.service';
import { ApiService } from '../../../../api.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoSelectDirective, FormStateDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInputRef') otpInputRefs!: QueryList<ElementRef<HTMLInputElement>>;

  isUat: boolean = environment.uat;
  isProd: boolean = environment.production && !environment.uat;
  @Input() currentLang: string = 'en';
  @Output() onLoginSuccess = new EventEmitter<any>();
  @Output() onSetLanguage = new EventEmitter<string>();

  loginError = '';
  loginCredentials = { username: '', password: '' };
  isSubmitting = false;

  // OTP State
  showOtpScreen = false;
  otpDigits: string[] = ['', '', '', '', '', ''];
  tempOtp = '';
  otpCountdown = 120;
  otpTimerInterval: any = null;
  showPassword = false;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  get otpValue(): string {
    return this.otpDigits.join('');
  }

  forgotPassword() {
    this.notificationService.showWarning(
      'Password Assistance',
      'Please contact your Futane Agro System Administrator or IT Helpdesk to initiate a password reset.'
    );
  }

  fillCredentials(username: string, password: string, autoSubmit = false) {
    this.loginCredentials = { username, password };
    this.loginError = '';
    if (autoSubmit) {
      this.handleLogin();
    }
  }

  ngOnInit() {
    // Purge any stale localhost backend_url to prevent missing /api proxy routing
    const saved = localStorage.getItem('backend_url');
    if (saved && (saved.includes('localhost') || saved.includes('127.0.0.1') || saved.includes(':8080') || saved.includes(':8081'))) {
      localStorage.removeItem('backend_url');
    }
  }

  unlockAndReset() {
    this.loginError = '';
    localStorage.removeItem('backend_url');
    this.loginCredentials = { username: 'SUPER_ADMIN', password: 'superadmin123' };
    this.notificationService.showInfo(
      'Credentials Populated',
      'Super Administrator credentials loaded. Click "Secure Sign In" to proceed.'
    );
  }

  handleLogin() {
    if (!this.loginCredentials.username?.trim()) {
      this.loginError = 'Please enter your username or employee ID.';
      return;
    }
    if (!this.loginCredentials.password) {
      this.loginError = 'Please enter your password.';
      return;
    }

    this.loginError = '';
    this.isSubmitting = true;

    // Clear any obsolete legacy backend URL from older versions
    const saved = localStorage.getItem('backend_url');
    if (saved && (saved.includes('localhost') || saved.includes('127.0.0.1') || saved.includes(':8080') || saved.includes(':8081'))) {
      localStorage.removeItem('backend_url');
    }

    this.apiService.login(this.loginCredentials).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.status === 'OTP_REQUIRED' || res.status === 'OTP_SENT') {
          this.showOtpScreen = true;
          this.tempOtp = res.tempOtp || '';
          this.otpDigits = ['', '', '', '', '', ''];
          this.startOtpTimer();
          setTimeout(() => {
            const firstInput = this.otpInputRefs?.first?.nativeElement;
            if (firstInput) firstInput.focus();
          }, 100);
        } else if (res.token) {
          this.completeLoginLocal(res);
        } else {
          this.loginError = 'Unexpected response received from authentication server.';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Login request failed:', err);
        if (err.status === 0) {
          this.loginError = 'Unable to connect to Futane Agro ERP backend. Please verify your network connection.';
        } else if (err.status === 500 && (!err.error?.message || err.error?.message.includes('Proxy error'))) {
          this.loginError = 'Authentication service is currently offline. Please notify the administrator.';
        } else if (err.status === 423 || (err.status === 403 && err.error?.message && err.error.message.toLowerCase().includes('lock'))) {
          this.loginError = err.error?.message || 'Account is locked due to multiple failed login attempts. Please wait 30 minutes.';
        } else if (err.status === 403) {
          this.loginError = err.error?.message || 'Access denied (403). Please verify your credentials or server connection.';
        } else if (err.status === 429) {
          this.loginError = err.error?.message || 'Rate limit exceeded. Please wait a moment before trying again.';
        } else if (err.status === 401) {
          this.loginError = err.error?.message || 'Invalid username or password. Please verify your credentials.';
        } else {
          this.loginError = err.error?.message || `Authentication error (${err.status}): ${err.statusText || 'Please try again.'}`;
        }
      }
    });
  }

  onDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value.length > 0) {
      this.otpDigits[index] = value.charAt(value.length - 1);
      input.value = this.otpDigits[index];

      if (index < 5) {
        const inputs = this.otpInputRefs.toArray();
        inputs[index + 1]?.nativeElement.focus();
      }
    }
  }

  onDigitKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        const inputs = this.otpInputRefs.toArray();
        inputs[index - 1]?.nativeElement.focus();
      } else {
        this.otpDigits[index] = '';
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.otpInputRefs.toArray()[index - 1]?.nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.otpInputRefs.toArray()[index + 1]?.nativeElement.focus();
    } else if (event.key === 'Enter') {
      if (this.otpValue.length === 6) {
        this.verifyOtp();
      }
    }
  }

  onDigitPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const cleanNumbers = pastedData.replace(/\D/g, '').slice(0, 6);
    if (cleanNumbers.length > 0) {
      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = cleanNumbers[i] || '';
      }
      const nextIndex = Math.min(cleanNumbers.length, 5);
      this.otpInputRefs.toArray()[nextIndex]?.nativeElement.focus();
    }
  }

  fillOtpFromHelper(code: string) {
    const digits = code.split('').slice(0, 6);
    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = digits[i] || '';
    }
    const inputs = this.otpInputRefs.toArray();
    inputs[5]?.nativeElement.focus();
  }

  startOtpTimer() {
    this.clearOtpTimer();
    this.otpCountdown = 120;
    this.otpTimerInterval = setInterval(() => {
      if (this.otpCountdown > 0) {
        this.otpCountdown--;
      } else {
        this.clearOtpTimer();
        this.loginError = 'Security code has expired. Please request a new code.';
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
    if (this.otpValue.length < 6) {
      this.loginError = 'Please enter all 6 digits of the verification code.';
      return;
    }

    this.loginError = '';
    this.isSubmitting = true;

    this.apiService.verifyOtp({
      username: this.loginCredentials.username,
      otp: this.otpValue
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.completeLoginLocal(res);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('OTP verification failed:', err);
        if (err.status === 0) {
          this.loginError = 'Connection failed. Please check your network and try again.';
        } else if (err.status === 429) {
          this.loginError = err.error?.message || 'Too many attempts. Please wait 60 seconds.';
        } else {
          this.loginError = err.error?.message || 'Invalid or expired verification code. Please check and try again.';
        }
      }
    });
  }

  resendOtp() {
    this.otpDigits = ['', '', '', '', '', ''];
    this.handleLogin();
  }

  backToLogin() {
    this.showOtpScreen = false;
    this.otpDigits = ['', '', '', '', '', ''];
    this.tempOtp = '';
    this.loginError = '';
    this.clearOtpTimer();
  }

  completeLoginLocal(res: any) {
    this.showOtpScreen = false;
    this.otpDigits = ['', '', '', '', '', ''];
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
