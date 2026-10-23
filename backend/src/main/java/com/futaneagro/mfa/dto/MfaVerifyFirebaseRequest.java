package com.futaneagro.mfa.dto;

import javax.validation.constraints.NotBlank;

/**
 * <h1>MfaVerifyFirebaseRequest (Step-2 Firebase Verification Request DTO)</h1>
 * <p>
 * Transmits the intermediate {@code preAuthToken} along with the client-side Firebase ID token
 * to finalize authentication and issue the primary JWT session token.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
public class MfaVerifyFirebaseRequest {

    @NotBlank(message = "Pre-authentication token is required")
    private String preAuthToken;

    @NotBlank(message = "Firebase ID token is required")
    private String firebaseIdToken;

    public MfaVerifyFirebaseRequest() {}

    public MfaVerifyFirebaseRequest(String preAuthToken, String firebaseIdToken) {
        this.preAuthToken = preAuthToken;
        this.firebaseIdToken = firebaseIdToken;
    }

    public String getPreAuthToken() {
        return preAuthToken;
    }

    public void setPreAuthToken(String preAuthToken) {
        this.preAuthToken = preAuthToken;
    }

    public String getFirebaseIdToken() {
        return firebaseIdToken;
    }

    public void setFirebaseIdToken(String firebaseIdToken) {
        this.firebaseIdToken = firebaseIdToken;
    }
}
