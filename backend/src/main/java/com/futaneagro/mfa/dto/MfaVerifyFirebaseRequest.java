package com.futaneagro.mfa.dto;

import javax.validation.constraints.NotBlank;

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
