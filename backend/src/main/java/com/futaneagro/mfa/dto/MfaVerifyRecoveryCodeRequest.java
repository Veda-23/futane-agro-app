package com.futaneagro.mfa.dto;

import javax.validation.constraints.NotBlank;

public class MfaVerifyRecoveryCodeRequest {

    @NotBlank(message = "Pre-authentication token is required")
    private String preAuthToken;

    @NotBlank(message = "Recovery code is required")
    private String recoveryCode;

    public MfaVerifyRecoveryCodeRequest() {}

    public MfaVerifyRecoveryCodeRequest(String preAuthToken, String recoveryCode) {
        this.preAuthToken = preAuthToken;
        this.recoveryCode = recoveryCode;
    }

    public String getPreAuthToken() {
        return preAuthToken;
    }

    public void setPreAuthToken(String preAuthToken) {
        this.preAuthToken = preAuthToken;
    }

    public String getRecoveryCode() {
        return recoveryCode;
    }

    public void setRecoveryCode(String recoveryCode) {
        this.recoveryCode = recoveryCode;
    }
}
