# Futane Agro ERP — Firebase Phone Auth MFA Setup & Runbook

This guide details the architecture, configuration, operation, and disaster recovery procedures for **SMS OTP-Based Multi-Factor Authentication (MFA)** powered by Firebase Phone Auth within Futane Agro ERP.

---

## 1. Architectural Principles

1. **ERP as Sole Source of Truth**:
   - User identities, credentials (BCrypt salted hashes), roles, and permissions reside exclusively in PostgreSQL (`t_core_user`).
   - Firebase is used **solely** as an out-of-band transport and verification gateway for SMS OTP. No ERP user data or roles are mirrored to Firebase Authentication user records.
2. **Zero Hardcoded Secrets in Source Code**:
   - The backend service account private key is loaded from external storage via `FIREBASE_CREDENTIALS_PATH`.
   - The frontend consumes only public Firebase configuration (`apiKey`, `projectId`, `appId`).
3. **Strict Separation of Pre-Auth and Authenticated Contexts**:
   - Upon successful Step 1 username/password verification, the backend issues a scoped **Pre-Auth JWT** (`scope: "PRE_MFA"`, 5-minute TTL, zero business roles).
   - `JwtRequestFilter` rejects any attempt by a `PRE_MFA` token to access business APIs.
   - The full ERP bearer JWT is issued only after valid cryptographic verification of the Firebase ID token or emergency recovery code.
4. **Token Replay Attack Mitigation**:
   - Each consumed Firebase ID token is hashed (SHA-256) and recorded in `t_mfa_used_tokens` with its expiration timestamp.
   - Reused tokens are immediately flagged and rejected with HTTP 401.

---

## 2. Configuration & Credentials Setup

### Step 2.1: Firebase Console Setup
1. Open the [Firebase Console](https://console.firebase.google.com/) and select or create the project (e.g., `futane-agro-erp`).
2. Navigate to **Authentication** > **Sign-in method** > **Phone** and toggle **Enable**.
3. Under **Phone numbers for testing (optional)**, add local development testing numbers to test without consuming SMS quotas:
   - Phone Number: `+91 99999 99999`
   - Verification Code: `123456`

### Step 2.2: Generate Backend Service Account Key
1. In Firebase Console, go to **Project settings** (gear icon) > **Service accounts**.
2. Select **Firebase Admin SDK** (Java) and click **Generate new private key**.
3. Store the downloaded JSON file **outside the repository workspace**, for example:
   - Windows: `C:\secrets\futane-agro-firebase-adminsdk.json`
4. Set the environment variable:
   ```powershell
   [System.Environment]::SetEnvironmentVariable("FIREBASE_CREDENTIALS_PATH", "C:\secrets\futane-agro-firebase-adminsdk.json", "User")
   ```

### Step 2.3: Configure Frontend Web Client
Update `frontend/src/environments/environment.ts` and `environment.uat.ts` with your public Firebase configuration:
```typescript
firebase: {
  apiKey: "YOUR_FIREBASE_WEB_API_KEY",
  authDomain: "futane-agro-erp.firebaseapp.com",
  projectId: "futane-agro-erp",
  storageBucket: "futane-agro-erp.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
}
```

---

## 3. Feature Flag Operation

| Property | Default Value | Description |
| :--- | :--- | :--- |
| `auth.mfa.firebase.enabled` | `false` | Master toggle. When `false`, all existing login flows behave with 100% legacy compatibility. |
| `auth.mfa.firebase.credentials-path` | `""` | File path to service-account JSON (falls back to `FIREBASE_CREDENTIALS_PATH` env var). |
| `auth.mfa.firebase.pre-auth-token-expiration-seconds` | `300` | Expiration time for Step 1 temporary pre-auth JWT. |

To enable MFA in local UAT or production:
```properties
auth.mfa.firebase.enabled=true
auth.mfa.firebase.credentials-path=C:/secrets/futane-agro-firebase-adminsdk.json
```

---

## 4. User Enrollment & Recovery Codes

1. **Self-Service Enrollment**:
   - An authenticated user navigates to **Administration** > **Settings** > **Security & Master Credentials**.
   - Under **Two-Factor Authentication**, click **Enable Phone 2FA**.
   - Enter mobile phone number in E.164 format (`+91XXXXXXXXXX`), solve the reCAPTCHA challenge, and enter the SMS verification code.
   - Upon successful verification, 10 single-use recovery codes (`XXXXX-XXXXX`) are generated and presented.
2. **Emergency Recovery Code Fallback**:
   - If a user loses phone access or SMS fails, they click **"Lost phone access? Use recovery code"** on the login screen.
   - Entering an unused backup recovery code grants immediate access, marks that code as used in `t_user_mfa_recovery_codes`, and logs an audit security event.

---

## 5. Security Audit Trail

All MFA operations produce structured events in `security_audit_logs` via `SecurityAuditService`:
- `MFA_CHALLENGE_ISSUED`: Step 1 password passed; pre-auth token issued.
- `MFA_VERIFY_SUCCESS`: Second factor verified successfully via Firebase.
- `MFA_VERIFY_FAILED`: Verification failed (invalid code, phone mismatch, or expired token).
- `MFA_RECOVERY_CODE_USED`: Emergency fallback code consumed.
- `MFA_ENROLLED`: User enrolled their phone in MFA.
- `MFA_DISABLED`: User disabled MFA with password confirmation.
