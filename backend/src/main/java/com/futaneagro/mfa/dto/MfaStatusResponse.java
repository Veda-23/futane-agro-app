package com.futaneagro.mfa.dto;

import java.util.List;

public class MfaStatusResponse {
    private boolean mfaEnabled;
    private String mfaFactor;
    private String maskedPhone;
    private int remainingRecoveryCodes;
    private List<String> recoveryCodes; // Populated only during enrollment or re-generation

    public MfaStatusResponse() {}

    public MfaStatusResponse(boolean mfaEnabled, String mfaFactor, String maskedPhone, int remainingRecoveryCodes) {
        this.mfaEnabled = mfaEnabled;
        this.mfaFactor = mfaFactor;
        this.maskedPhone = maskedPhone;
        this.remainingRecoveryCodes = remainingRecoveryCodes;
    }

    public boolean isMfaEnabled() {
        return mfaEnabled;
    }

    public void setMfaEnabled(boolean mfaEnabled) {
        this.mfaEnabled = mfaEnabled;
    }

    public String getMfaFactor() {
        return mfaFactor;
    }

    public void setMfaFactor(String mfaFactor) {
        this.mfaFactor = mfaFactor;
    }

    public String getMaskedPhone() {
        return maskedPhone;
    }

    public void setMaskedPhone(String maskedPhone) {
        this.maskedPhone = maskedPhone;
    }

    public int getRemainingRecoveryCodes() {
        return remainingRecoveryCodes;
    }

    public void setRemainingRecoveryCodes(int remainingRecoveryCodes) {
        this.remainingRecoveryCodes = remainingRecoveryCodes;
    }

    public List<String> getRecoveryCodes() {
        return recoveryCodes;
    }

    public void setRecoveryCodes(List<String> recoveryCodes) {
        this.recoveryCodes = recoveryCodes;
    }
}
