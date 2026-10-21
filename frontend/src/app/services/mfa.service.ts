import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MfaStatus {
  mfaEnabled: boolean;
  mfaFactor?: string;
  maskedPhone?: string;
  remainingRecoveryCodes?: number;
  recoveryCodes?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MfaService {
  private firebaseApp: any = null;
  private firebaseAuth: any = null;
  private confirmationResult: any = null;
  private recaptchaVerifier: any = null;

  constructor(private http: HttpClient) {}

  /**
   * Initializes Firebase app and auth instance on demand (lazy).
   */
  async ensureFirebaseInitialized(): Promise<any> {
    if (this.firebaseAuth) {
      return this.firebaseAuth;
    }

    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');

    const config = (environment as any).firebase;
    if (!config || !config.apiKey) {
      throw new Error('Firebase configuration missing in environment.');
    }

    this.firebaseApp = getApps().length ? getApp() : initializeApp(config);
    this.firebaseAuth = getAuth(this.firebaseApp);
    return this.firebaseAuth;
  }

  /**
   * Initializes an invisible or visible reCAPTCHA verifier for Phone Auth.
   */
  async setupRecaptcha(containerId: string, size: 'invisible' | 'normal' = 'invisible'): Promise<any> {
    const auth = await this.ensureFirebaseInitialized();
    const { RecaptchaVerifier } = await import('firebase/auth');

    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (e) {
        // Ignored
      }
    }

    this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: size,
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired. Prompting user to retry.');
      }
    });

    await this.recaptchaVerifier.render();
    return this.recaptchaVerifier;
  }

  /**
   * Triggers Firebase Phone SMS OTP delivery.
   */
  async sendPhoneOtp(phoneNumberE164: string, containerId: string = 'recaptcha-container'): Promise<void> {
    const auth = await this.ensureFirebaseInitialized();
    const { signInWithPhoneNumber } = await import('firebase/auth');

    if (!this.recaptchaVerifier) {
      await this.setupRecaptcha(containerId);
    }

    this.confirmationResult = await signInWithPhoneNumber(auth, phoneNumberE164, this.recaptchaVerifier);
  }

  /**
   * Verifies the SMS OTP with Firebase and obtains the Firebase ID Token.
   */
  async confirmOtpAndGetIdToken(otpCode: string): Promise<string> {
    if (!this.confirmationResult) {
      throw new Error('No active verification in progress. Please request an OTP first.');
    }

    const userCredential = await this.confirmationResult.confirm(otpCode);
    const idToken = await userCredential.user.getIdToken(true);
    return idToken;
  }

  /**
   * Clean up reCAPTCHA resources.
   */
  clearRecaptcha(): void {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (e) {}
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }

  // ─── Backend API Calls ──────────────────────────────────────────────────────

  /**
   * Submit Firebase ID token + preAuthToken to ERP backend for final verification.
   */
  verifyFirebaseOtpBackend(preAuthToken: string, firebaseIdToken: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/mfa/verify-firebase-otp`, {
      preAuthToken,
      firebaseIdToken
    }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Submit emergency backup recovery code to ERP backend.
   */
  verifyRecoveryCodeBackend(preAuthToken: string, recoveryCode: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/mfa/verify-recovery-code`, {
      preAuthToken,
      recoveryCode
    }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Get MFA status of logged-in user.
   */
  getMfaStatus(): Observable<MfaStatus> {
    return this.http.get<MfaStatus>(`${environment.apiUrl}/users/mfa/status`);
  }

  /**
   * Enroll phone into MFA.
   */
  enrollMfa(firebaseIdToken: string): Observable<MfaStatus> {
    return this.http.post<MfaStatus>(`${environment.apiUrl}/users/mfa/enroll`, {
      firebaseIdToken
    });
  }

  /**
   * Disable MFA.
   */
  disableMfa(password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/mfa/disable`, {
      password
    });
  }

  /**
   * Re-generate 10 emergency recovery codes.
   */
  regenerateRecoveryCodes(password: string): Observable<{ recoveryCodes: string[]; count: number }> {
    return this.http.post<any>(`${environment.apiUrl}/users/mfa/regenerate-recovery-codes`, {
      password
    });
  }
}
