import { Component, OnInit, EventEmitter, Input, Output, OnDestroy, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoSelectDirective } from '../../../../directives/auto-select.directive';
import { FormStateDirective } from '../../../../directives/form-state.directive';
import { NotificationService } from '../../../../services/notification.service';
import { ApiService } from '../../../../api.service';
import { MfaService } from '../../../../services/mfa.service';
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

  // Tab State: 'login' or 'register'
  activeAuthTab: 'login' | 'register' = 'login';

  // Registration State
  registerData = {
    name: '',
    username: '',
    email: '',
    mobileNumber: '',
    role: 'VIEWER',
    password: '',
    confirmPassword: ''
  };
  showRegisterPassword = false;
  showRegisterConfirmPassword = false;
  registerError = '';
  registerSuccess = '';
  isRegistering = false;

  availableRoles = [
    { value: 'OPERATOR', label: 'Plant Operator', icon: 'bi-gear-wide-connected', desc: 'Production batches, machines & dispatch' },
    { value: 'ACCOUNTANT', label: 'Accounts & Billing', icon: 'bi-receipt-cutoff', desc: 'GST invoices, billing & payments' },
    { value: 'STORE_MANAGER', label: 'Store & Silo Control', icon: 'bi-box-seam', desc: 'Raw material intake & silo ledgers' },
    { value: 'VIEWER', label: 'General / Viewer', icon: 'bi-eye', desc: 'Read-only access to operational logs' }
  ];

  // OTP State
  showOtpScreen = false;
  otpDigits: string[] = ['', '', '', '', '', ''];
  tempOtp = '';
  otpCountdown = 120;
  otpTimerInterval: any = null;
  showPassword = false;

  // Multi-Factor Authentication (MFA) State
  isMfaFlow = false;
  mfaFactor = '';
  preAuthToken = '';
  maskedPhone = '';
  showRecoveryCodeMode = false;
  recoveryCodeInput = '';
  isRecaptchaLoading = false;

  // Live Telemetry & Helpdesk State
  liveClock = '';
  private clockTimer: any = null;
  showForgotPasswordModal = false;

  constructor(
    private apiService: ApiService,
    private mfaService: MfaService,
    private notificationService: NotificationService
  ) {}

  get otpValue(): string {
    return this.otpDigits.join('');
  }

  switchAuthTab(tab: 'login' | 'register') {
    this.activeAuthTab = tab;
    this.loginError = '';
    this.registerError = '';
    this.registerSuccess = '';
  }

  get hasMinLength(): boolean {
    return (this.registerData.password || '').length >= 6;
  }

  get hasMixedCase(): boolean {
    const p = this.registerData.password || '';
    return /[A-Z]/.test(p) && /[a-z]/.test(p);
  }

  get hasNumberOrSymbol(): boolean {
    const p = this.registerData.password || '';
    return /[0-9]/.test(p) || /[^A-Za-z0-9]/.test(p);
  }

  updateClock() {
    const now = new Date();
    this.liveClock = now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
  }

  getPasswordStrength(): { score: number; label: string; colorClass: string } {
    const p = this.registerData.password || '';
    if (!p) return { score: 0, label: '', colorClass: '' };
    let score = 0;
    if (this.hasMinLength) score++;
    if (p.length >= 10) score++;
    if (this.hasMixedCase) score++;
    if (this.hasNumberOrSymbol) score++;

    if (score <= 1) return { score: 25, label: 'Basic', colorClass: 'strength-weak' };
    if (score === 2) return { score: 50, label: 'Fair', colorClass: 'strength-fair' };
    if (score === 3) return { score: 75, label: 'Good', colorClass: 'strength-good' };
    return { score: 100, label: 'High Security', colorClass: 'strength-strong' };
  }

  handleRegister() {
    this.registerError = '';
    this.registerSuccess = '';

    const name = this.registerData.name?.trim();
    const username = this.registerData.username?.trim();
    const email = this.registerData.email?.trim();
    const password = this.registerData.password;
    const confirmPassword = this.registerData.confirmPassword;

    if (!name || name.length < 2) {
      this.registerError = 'Please enter your full name (minimum 2 characters).';
      return;
    }
    if (!username || username.length < 3) {
      this.registerError = 'Username must be at least 3 characters.';
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      this.registerError = 'Username can only contain letters, numbers, dots, and underscores.';
      return;
    }
    if (!email || !/^[A-Za-z0-9+_.-]+@(.+)$/.test(email)) {
      this.registerError = 'Please enter a valid work email address.';
      return;
    }
    if (!password || password.length < 6) {
      this.registerError = 'Password must be at least 6 characters.';
      return;
    }
    if (password !== confirmPassword) {
      this.registerError = 'Passwords do not match. Please re-enter to confirm.';
      return;
    }

    this.isRegistering = true;
    this.apiService.register({
      name,
      username,
      email,
      mobileNumber: this.registerData.mobileNumber?.trim() || null,
      password,
      role: this.registerData.role || 'VIEWER'
    }).subscribe({
      next: (res: any) => {
        this.isRegistering = false;
        this.registerSuccess = res.message || 'Account registered successfully!';
        this.notificationService.success(
          'Registration Successful',
          `Welcome, ${name}! Your account has been created. Redirecting to Sign In...`
        );
        // Prepopulate login credentials and transition to login tab
        this.loginCredentials.username = username;
        this.loginCredentials.password = password;

        setTimeout(() => {
          this.activeAuthTab = 'login';
          this.registerSuccess = '';
        }, 1200);
      },
      error: (err: any) => {
        this.isRegistering = false;
        console.error('Registration failed:', err);
        if (err.status === 409) {
          this.registerError = err.error?.message || 'Username or email already in use.';
        } else if (err.status === 429) {
          this.registerError = 'Too many registration requests. Please wait a moment.';
        } else {
          this.registerError = err.error?.message || 'Failed to complete registration. Please try again.';
        }
      }
    });
  }

  forgotPassword() {
    this.showForgotPasswordModal = true;
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal = false;
  }

  fillCredentials(username: string, password: string, autoSubmit = false) {
    this.loginCredentials = { username, password };
    this.loginError = '';
    if (autoSubmit) {
      this.handleLogin();
    }
  }

  ngOnInit() {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 1000);

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
        if (res.mfaRequired || res.status === 'MFA_REQUIRED') {
          this.initiateMfaFlow(res);
        } else if (res.status === 'OTP_REQUIRED' || res.status === 'OTP_SENT') {
          this.isMfaFlow = false;
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

  initiateMfaFlow(res: any) {
    this.isMfaFlow = true;
    this.showOtpScreen = true;
    this.showRecoveryCodeMode = false;
    this.recoveryCodeInput = '';
    this.preAuthToken = res.preAuthToken || '';
    this.maskedPhone = res.maskedPhone || '';
    this.mfaFactor = res.factor || 'PHONE_FIREBASE';
    this.tempOtp = '';
    this.otpDigits = ['', '', '', '', '', ''];
    this.startOtpTimer();

    // Trigger Firebase Phone Auth SMS if PHONE_FIREBASE factor
    if (this.mfaFactor === 'PHONE_FIREBASE') {
      this.sendFirebaseSms();
    }
  }

  async sendFirebaseSms() {
    this.isRecaptchaLoading = true;
    try {
      // In local dev/UAT environment without a live real-time SMS gateway configured,
      // Firebase will use either test phone numbers or reCAPTCHA
      await this.mfaService.setupRecaptcha('firebase-recaptcha-verifier', 'invisible');
      this.isRecaptchaLoading = false;
    } catch (err: any) {
      this.isRecaptchaLoading = false;
      console.warn('Firebase reCAPTCHA setup:', err.message);
    }
  }

  toggleRecoveryCodeMode() {
    this.showRecoveryCodeMode = !this.showRecoveryCodeMode;
    this.loginError = '';
    this.recoveryCodeInput = '';
  }

  async verifyOtp() {
    this.loginError = '';
    this.isSubmitting = true;

    // ── MFA Branch ──
    if (this.isMfaFlow) {
      if (this.showRecoveryCodeMode) {
        if (!this.recoveryCodeInput.trim()) {
          this.loginError = 'Please enter your emergency recovery code.';
          this.isSubmitting = false;
          return;
        }

        this.mfaService.verifyRecoveryCodeBackend(this.preAuthToken, this.recoveryCodeInput.trim()).subscribe({
          next: (res) => {
            this.isSubmitting = false;
            this.completeLoginLocal(res);
          },
          error: (err) => {
            this.isSubmitting = false;
            this.handleMfaError(err);
          }
        });
      } else {
        // Firebase Phone Auth OTP
        if (this.otpValue.length < 6) {
          this.loginError = 'Please enter all 6 digits of the SMS verification code.';
          this.isSubmitting = false;
          return;
        }

        try {
          const firebaseIdToken = await this.mfaService.confirmOtpAndGetIdToken(this.otpValue);
          this.mfaService.verifyFirebaseOtpBackend(this.preAuthToken, firebaseIdToken).subscribe({
            next: (res) => {
              this.isSubmitting = false;
              this.completeLoginLocal(res);
            },
            error: (err) => {
              this.isSubmitting = false;
              this.handleMfaError(err);
            }
          });
        } catch (err: any) {
          this.isSubmitting = false;
          console.error('Firebase OTP confirmation error:', err);
          this.loginError = err.message || 'Invalid or expired SMS OTP. Please check and try again.';
        }
      }
      return;
    }

    // ── Legacy / Internal OTP Branch ──
    if (this.otpValue.length < 6) {
      this.loginError = 'Please enter all 6 digits of the verification code.';
      this.isSubmitting = false;
      return;
    }

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

  handleMfaError(err: any) {
    console.error('MFA verification failed:', err);
    if (err.status === 0) {
      this.loginError = 'Connection failed. Please check your network and try again.';
    } else if (err.status === 429) {
      this.loginError = err.error?.message || 'Too many attempts. Please wait 60 seconds.';
    } else if (err.status === 401) {
      this.loginError = err.error?.message || 'Verification failed. Pre-auth token or OTP is invalid.';
    } else {
      this.loginError = err.error?.message || 'MFA verification failed. Please try again.';
    }
  }

  resendOtp() {
    this.otpDigits = ['', '', '', '', '', ''];
    if (this.isMfaFlow) {
      this.sendFirebaseSms();
    } else {
      this.handleLogin();
    }
  }

  backToLogin() {
    this.showOtpScreen = false;
    this.isMfaFlow = false;
    this.showRecoveryCodeMode = false;
    this.preAuthToken = '';
    this.maskedPhone = '';
    this.otpDigits = ['', '', '', '', '', ''];
    this.tempOtp = '';
    this.loginError = '';
    this.clearOtpTimer();
    this.mfaService.clearRecaptcha();
  }

  completeLoginLocal(res: any) {
    this.showOtpScreen = false;
    this.isMfaFlow = false;
    this.showRecoveryCodeMode = false;
    this.preAuthToken = '';
    this.maskedPhone = '';
    this.otpDigits = ['', '', '', '', '', ''];
    this.tempOtp = '';
    this.clearOtpTimer();
    this.mfaService.clearRecaptcha();
    this.onLoginSuccess.emit(res);
  }

  setLanguage(lang: string) {
    this.onSetLanguage.emit(lang);
  }

  ngOnDestroy() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
    this.clearOtpTimer();
    this.mfaService.clearRecaptcha();
  }
}
