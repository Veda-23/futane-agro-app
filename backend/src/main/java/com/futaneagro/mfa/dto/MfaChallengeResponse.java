package com.futaneagro.mfa.dto;

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
