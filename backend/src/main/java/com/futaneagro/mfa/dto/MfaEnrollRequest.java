package com.futaneagro.mfa.dto;

import javax.validation.constraints.NotBlank;
import java.util.List;

public class MfaEnrollRequest {

    @NotBlank(message = "Firebase ID token is required to prove phone ownership")
    private String firebaseIdToken;

    public MfaEnrollRequest() {}

    public MfaEnrollRequest(String firebaseIdToken) {
        this.firebaseIdToken = firebaseIdToken;
    }

    public String getFirebaseIdToken() {
        return firebaseIdToken;
    }

    public void setFirebaseIdToken(String firebaseIdToken) {
        this.firebaseIdToken = firebaseIdToken;
    }
}
