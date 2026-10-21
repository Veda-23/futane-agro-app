package com.futaneagro.mfa;

import com.futaneagro.entity.MfaUsedToken;
import com.futaneagro.entity.User;
import com.futaneagro.entity.UserMfaRecoveryCode;
import com.futaneagro.repository.MfaUsedTokenRepository;
import com.futaneagro.repository.UserMfaRecoveryCodeRepository;
import com.futaneagro.repository.UserRepository;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class FirebaseMfaService {

    private static final Logger log = LoggerFactory.getLogger(FirebaseMfaService.class);
    private static final String RECOVERY_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Autowired
    private MfaProperties mfaProperties;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMfaRecoveryCodeRepository recoveryCodeRepository;

    @Autowired
    private MfaUsedTokenRepository usedTokenRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private boolean firebaseInitialized = false;

    @PostConstruct
    public void init() {
        if (!mfaProperties.isEnabled()) {
            log.info("MFA: Firebase Phone MFA is disabled by configuration (auth.mfa.firebase.enabled=false).");
            return;
        }

        try {
            if (FirebaseApp.getApps().isEmpty()) {
                String credentialsPath = mfaProperties.getCredentialsPath();
                if (credentialsPath == null || credentialsPath.trim().isEmpty()) {
                    credentialsPath = System.getenv("FIREBASE_CREDENTIALS_PATH");
                }
                if (credentialsPath == null || credentialsPath.trim().isEmpty()) {
                    credentialsPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
                }

                if (credentialsPath != null && !credentialsPath.trim().isEmpty()) {
                    File file = new File(credentialsPath.trim());
                    if (file.exists()) {
                        try (InputStream serviceAccount = new FileInputStream(file)) {
                            FirebaseOptions options = FirebaseOptions.builder()
                                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                                    .build();
                            FirebaseApp.initializeApp(options);
                            firebaseInitialized = true;
                            log.info("MFA: FirebaseApp initialized successfully from {}", file.getAbsolutePath());
                        }
                    } else {
                        log.warn("MFA: Specified credentials file does not exist: {}", credentialsPath);
                    }
                } else {
                    log.warn("MFA: Firebase Phone MFA enabled but no credentials path specified (auth.mfa.firebase.credentials-path / FIREBASE_CREDENTIALS_PATH).");
                }
            } else {
                firebaseInitialized = true;
            }
        } catch (Exception e) {
            log.error("MFA: Failed to initialize FirebaseApp: {}", e.getMessage(), e);
        }
    }

    public boolean isMfaEnabledGlobally() {
        return mfaProperties.isEnabled();
    }

    public boolean isFirebaseReady() {
        return firebaseInitialized && !FirebaseApp.getApps().isEmpty();
    }

    /**
     * Verifies Firebase ID Token, asserts that the phone number in the token matches
     * user's registered phone, and protects against token replay.
     */
    @Transactional
    public boolean verifyFirebaseIdToken(User user, String idToken) {
        if (!isMfaEnabledGlobally()) {
            throw new IllegalStateException("MFA is not enabled globally.");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Firebase ID token must not be empty.");
        }

        // 1. Prevent Replay Attacks: check SHA-256 hash of idToken
        String tokenHash = sha256Hex(idToken);
        if (usedTokenRepository.existsByTokenHash(tokenHash)) {
            log.warn("MFA SECURITY ALERT: Replay attack detected for user {} using used token hash {}", user.getUsername(), tokenHash);
            throw new SecurityException("MFA token has already been consumed. Please request a new verification code.");
        }

        // 2. Verify with Firebase Admin SDK
        try {
            if (!isFirebaseReady()) {
                init();
                if (!isFirebaseReady()) {
                    throw new IllegalStateException("Firebase Admin SDK is not initialized. Please configure valid service account credentials.");
                }
            }

            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken, true);
            String verifiedPhone = (String) decodedToken.getClaims().get("phone_number");

            if (verifiedPhone == null || verifiedPhone.isBlank()) {
                log.warn("MFA: Firebase token does not contain a verified phone_number claim for user {}", user.getUsername());
                return false;
            }

            // 3. Match against registered user phone
            String expectedPhone = user.getMfaPhoneE164();
            if (expectedPhone == null || expectedPhone.isBlank()) {
                expectedPhone = user.getMobileNumber();
            }

            String normalizedVerified = normalizeE164(verifiedPhone);
            String normalizedExpected = normalizeE164(expectedPhone);

            if (!normalizedVerified.equals(normalizedExpected)) {
                log.warn("MFA MISMATCH: Phone in token ({}) does not match expected user phone ({}) for user {}",
                        normalizedVerified, normalizedExpected, user.getUsername());
                return false;
            }

            // 4. Mark token as used to prevent replay
            Object expClaim = decodedToken.getClaims().get("exp");
            long expSeconds = (expClaim instanceof Number)
                    ? ((Number) expClaim).longValue()
                    : (System.currentTimeMillis() / 1000L + 3600L);
            LocalDateTime expiresAt = LocalDateTime.ofInstant(Instant.ofEpochSecond(expSeconds), ZoneId.systemDefault());
            usedTokenRepository.save(new MfaUsedToken(tokenHash, user.getId(), expiresAt));

            return true;

        } catch (Exception e) {
            log.error("MFA: Verification of Firebase ID token failed for user {}: {}", user.getUsername(), e.getMessage());
            throw new SecurityException("Invalid or expired verification token: " + e.getMessage());
        }
    }

    /**
     * Verifies single-use emergency backup recovery code.
     */
    @Transactional
    public boolean verifyRecoveryCode(User user, String plainCode) {
        if (plainCode == null || plainCode.isBlank()) {
            return false;
        }

        String sanitizedCode = plainCode.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
        List<UserMfaRecoveryCode> activeCodes = recoveryCodeRepository.findByUserIdAndUsedFalse(user.getId());

        for (UserMfaRecoveryCode codeEntity : activeCodes) {
            if (passwordEncoder.matches(sanitizedCode, codeEntity.getCodeHash())) {
                codeEntity.setUsed(true);
                codeEntity.setUsedAt(LocalDateTime.now());
                recoveryCodeRepository.save(codeEntity);
                log.info("MFA: User {} successfully consumed emergency recovery code.", user.getUsername());
                return true;
            }
        }

        log.warn("MFA: Invalid recovery code attempt for user {}", user.getUsername());
        return false;
    }

    /**
     * Generates a new set of 10 single-use recovery codes, invalidating previous unused codes.
     */
    @Transactional
    public List<String> generateRecoveryCodes(String userId) {
        recoveryCodeRepository.deleteByUserId(userId);

        List<String> plainCodes = new ArrayList<>();
        List<UserMfaRecoveryCode> entities = new ArrayList<>();

        for (int i = 0; i < 10; i++) {
            StringBuilder sb = new StringBuilder();
            for (int j = 0; j < 10; j++) {
                sb.append(RECOVERY_CODE_CHARS.charAt(SECURE_RANDOM.nextInt(RECOVERY_CODE_CHARS.length())));
            }
            String plainCode = sb.substring(0, 5) + "-" + sb.substring(5);
            plainCodes.add(plainCode);

            String hash = passwordEncoder.encode(plainCode.replace("-", ""));
            entities.add(new UserMfaRecoveryCode(userId, hash));
        }

        recoveryCodeRepository.saveAll(entities);
        return plainCodes;
    }

    public long getRemainingRecoveryCodeCount(String userId) {
        return recoveryCodeRepository.countByUserIdAndUsedFalse(userId);
    }

    public String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return "N/A";
        }
        String clean = phone.trim();
        if (clean.length() <= 4) {
            return "****";
        }
        int visibleCount = 4;
        String lastDigits = clean.substring(clean.length() - visibleCount);
        String prefix = clean.startsWith("+") ? clean.substring(0, Math.min(3, clean.length() - visibleCount)) : "";
        return prefix + "******" + lastDigits;
    }

    public String normalizeE164(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("[^0-9+]", "");
        if (!digits.startsWith("+")) {
            // Default to India +91 if 10 digits
            if (digits.length() == 10) {
                digits = "+91" + digits;
            } else {
                digits = "+" + digits;
            }
        }
        return digits;
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm missing", e);
        }
    }
}
