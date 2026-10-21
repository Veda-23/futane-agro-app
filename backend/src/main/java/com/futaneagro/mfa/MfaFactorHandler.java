package com.futaneagro.mfa;

import com.futaneagro.entity.User;
import java.util.Map;

/**
 * Strategy interface for multi-factor authentication handlers.
 * Allows seamless addition of new MFA factors (TOTP, WebAuthn/Passkeys, Email OTP)
 * alongside Firebase Phone Auth.
 */
public interface MfaFactorHandler {

    /**
     * Unique factor identifier, e.g. "PHONE_FIREBASE", "TOTP", "WEBAUTHN".
     */
    String getFactorType();

    /**
     * Prepares challenge details to return to the client upon successful step 1 password authentication.
     */
    Map<String, Object> createChallengeData(User user);

    /**
     * Verifies the second factor payload supplied by the client.
     * Throws an exception or returns false if verification fails.
     */
    boolean verify(User user, Map<String, Object> payload);
}
