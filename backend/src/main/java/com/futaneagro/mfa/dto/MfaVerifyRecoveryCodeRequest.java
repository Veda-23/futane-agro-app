package com.futaneagro.mfa.dto;

import javax.validation.constraints.NotBlank;

/**
 * <h1>MfaVerifyRecoveryCodeRequest (Step-2 Emergency Recovery Code DTO)</h1>
 * <p>
 * Transmits the intermediate {@code preAuthToken} along with an unused one-time emergency recovery code
 * for account recovery when a user has lost access to their mobile device.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
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
