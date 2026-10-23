package com.futaneagro.mfa.dto;

import javax.validation.constraints.NotBlank;
import java.util.List;

/**
 * <h1>MfaEnrollRequest (Phone MFA Enrollment DTO)</h1>
 * <p>
 * Carries the client-side Firebase ID token proving successful phone ownership verification.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
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
