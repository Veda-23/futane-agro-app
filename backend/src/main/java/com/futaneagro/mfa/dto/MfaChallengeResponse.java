package com.futaneagro.mfa.dto;

/**
 * <h1>MfaChallengeResponse (Step-1 Authentication Challenge DTO)</h1>
 * <p>
 * Returned by {@code /api/users/login} when the user's primary password succeeds
 * but their account requires second-factor verification.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
public class MfaChallengeResponse {
    private boolean mfaRequired = true;
    private String factor;
    private String preAuthToken;
    private String maskedPhone;

    public MfaChallengeResponse() {}

    public MfaChallengeResponse(String factor, String preAuthToken, String maskedPhone) {
        this.mfaRequired = true;
        this.factor = factor;
        this.preAuthToken = preAuthToken;
        this.maskedPhone = maskedPhone;
    }

    public boolean isMfaRequired() {
        return mfaRequired;
    }

    public void setMfaRequired(boolean mfaRequired) {
        this.mfaRequired = mfaRequired;
    }

    public String getFactor() {
        return factor;
    }

    public void setFactor(String factor) {
        this.factor = factor;
    }

    public String getPreAuthToken() {
        return preAuthToken;
    }

    public void setPreAuthToken(String preAuthToken) {
        this.preAuthToken = preAuthToken;
    }

    public String getMaskedPhone() {
        return maskedPhone;
    }

    public void setMaskedPhone(String maskedPhone) {
        this.maskedPhone = maskedPhone;
    }
}
