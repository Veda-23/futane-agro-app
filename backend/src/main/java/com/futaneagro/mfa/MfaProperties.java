package com.futaneagro.mfa;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "auth.mfa.firebase")
public class MfaProperties {

    /**
     * Master feature flag: default false to strictly preserve existing auth behaviour
     */
    private boolean enabled = false;

    /**
     * File path to Firebase Service Account JSON (can also come from FIREBASE_CREDENTIALS_PATH env var)
     */
    private String credentialsPath = "";

    /**
     * Expiration time in seconds for the temporary pre-authentication JWT (default 5 minutes)
     */
    private int preAuthTokenExpirationSeconds = 300;

    /**
     * Allowed clock skew in seconds for Firebase token validation (default 60s)
     */
    private int allowedClockSkewSeconds = 60;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getCredentialsPath() {
        return credentialsPath;
    }

    public void setCredentialsPath(String credentialsPath) {
        this.credentialsPath = credentialsPath;
    }

    public int getPreAuthTokenExpirationSeconds() {
        return preAuthTokenExpirationSeconds;
    }

    public void setPreAuthTokenExpirationSeconds(int preAuthTokenExpirationSeconds) {
        this.preAuthTokenExpirationSeconds = preAuthTokenExpirationSeconds;
    }

    public int getAllowedClockSkewSeconds() {
        return allowedClockSkewSeconds;
    }

    public void setAllowedClockSkewSeconds(int allowedClockSkewSeconds) {
        this.allowedClockSkewSeconds = allowedClockSkewSeconds;
    }
}
