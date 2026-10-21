package com.futaneagro.controller;

import com.futaneagro.entity.User;
import com.futaneagro.mfa.FirebaseMfaService;
import com.futaneagro.mfa.PhoneFirebaseFactorHandler;
import com.futaneagro.mfa.dto.MfaEnrollRequest;
import com.futaneagro.mfa.dto.MfaStatusResponse;
import com.futaneagro.mfa.dto.MfaVerifyFirebaseRequest;
import com.futaneagro.mfa.dto.MfaVerifyRecoveryCodeRequest;
import com.futaneagro.repository.UserRepository;
import com.futaneagro.security.JwtUtils;
import com.futaneagro.security.RateLimitingService;
import com.futaneagro.security.SecurityAuditService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/users/mfa")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MfaAuthController {

    private static final Logger logger = LoggerFactory.getLogger(MfaAuthController.class);

    @Autowired
    private FirebaseMfaService firebaseMfaService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SecurityAuditService securityAuditService;

    @Autowired
    private RateLimitingService rateLimitingService;

    private Map<String, Object> error(String error, String message, int status) {
        Map<String, Object> map = new HashMap<>();
        map.put("error", error);
        map.put("message", message);
        map.put("status", status);
        return map;
    }

    /**
     * Step 2: Verify Firebase ID Token and issue standard ERP JWT.
     */
    @PostMapping("/verify-firebase-otp")
    public ResponseEntity<?> verifyFirebaseOtp(@Valid @RequestBody MfaVerifyFirebaseRequest req, HttpServletRequest request) {
        if (rateLimitingService.isRateLimited(request, RateLimitingService.Action.OTP_VERIFY)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(error("Too Many Requests", "Too many verification attempts. Please wait 60 seconds.", 429));
        }

        try {
            if (!jwtUtils.validatePreAuthToken(req.getPreAuthToken())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(error("Unauthorized", "Pre-authentication token has expired or is invalid. Please sign in again.", 401));
            }

            String userId = jwtUtils.extractUserId(req.getPreAuthToken());
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(error("Unauthorized", "User associated with pre-authentication token not found.", 401));
            }

            User user = userOpt.get();
            boolean verified = firebaseMfaService.verifyFirebaseIdToken(user, req.getFirebaseIdToken());

            if (!verified) {
                securityAuditService.logMfaFailed(user.getUsername(), PhoneFirebaseFactorHandler.FACTOR_TYPE, "Phone number mismatch or invalid token", request);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(error("Unauthorized", "Verification failed. The OTP did not match the registered phone.", 401));
            }

            // Verification successful — Issue standard ERP token
            return completeLogin(user, PhoneFirebaseFactorHandler.FACTOR_TYPE, request);

        } catch (SecurityException se) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(error("Unauthorized", se.getMessage(), 401));
        } catch (Exception e) {
            logger.error("Error verifying Firebase MFA OTP: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("Internal Server Error", "MFA verification failed: " + e.getMessage(), 500));
        }
    }

    /**
     * Step 2 Fallback: Verify single-use emergency backup recovery code.
     */
    @PostMapping("/verify-recovery-code")
    public ResponseEntity<?> verifyRecoveryCode(@Valid @RequestBody MfaVerifyRecoveryCodeRequest req, HttpServletRequest request) {
        if (rateLimitingService.isRateLimited(request, RateLimitingService.Action.OTP_VERIFY)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(error("Too Many Requests", "Too many attempts. Please wait 60 seconds.", 429));
        }

        try {
            if (!jwtUtils.validatePreAuthToken(req.getPreAuthToken())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(error("Unauthorized", "Pre-authentication token has expired or is invalid. Please sign in again.", 401));
            }

            String userId = jwtUtils.extractUserId(req.getPreAuthToken());
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(error("Unauthorized", "User associated with pre-authentication token not found.", 401));
            }

            User user = userOpt.get();
            boolean verified = firebaseMfaService.verifyRecoveryCode(user, req.getRecoveryCode());

            if (!verified) {
                securityAuditService.logMfaFailed(user.getUsername(), "RECOVERY_CODE", "Invalid or already consumed recovery code", request);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(error("Unauthorized", "Invalid or already consumed recovery code.", 401));
            }

            securityAuditService.logMfaRecoveryCodeUsed(user.getUsername(), request);
            return completeLogin(user, "RECOVERY_CODE", request);

        } catch (Exception e) {
            logger.error("Error verifying recovery code: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("Internal Server Error", "Recovery verification failed: " + e.getMessage(), 500));
        }
    }

    /**
     * Get current user's MFA enrollment status. Requires standard authenticated JWT.
     */
    @GetMapping("/status")
    public ResponseEntity<?> getMfaStatus(HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Unauthorized", "Authentication required", 401));
        }

        String phone = user.getMfaPhoneE164() != null ? user.getMfaPhoneE164() : user.getMobileNumber();
        int remaining = (int) firebaseMfaService.getRemainingRecoveryCodeCount(user.getId());

        MfaStatusResponse status = new MfaStatusResponse(
                user.getMfaEnabled(),
                user.getMfaFactor(),
                firebaseMfaService.maskPhone(phone),
                remaining
        );
        return ResponseEntity.ok(status);
    }

    /**
     * Enroll in Firebase Phone MFA. User provides Firebase ID token proving phone ownership.
     */
    @PostMapping("/enroll")
    public ResponseEntity<?> enroll(@Valid @RequestBody MfaEnrollRequest req, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Unauthorized", "Authentication required", 401));
        }

        try {
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(req.getFirebaseIdToken(), true);
            String verifiedPhone = (String) decoded.getClaims().get("phone_number");
            if (verifiedPhone == null || verifiedPhone.isBlank()) {
                return ResponseEntity.badRequest().body(error("Bad Request", "Firebase ID token does not contain a verified phone number.", 400));
            }

            user.setMfaEnabled(true);
            user.setMfaFactor(PhoneFirebaseFactorHandler.FACTOR_TYPE);
            user.setMfaPhoneE164(firebaseMfaService.normalizeE164(verifiedPhone));
            userRepository.save(user);

            // Generate 10 recovery codes
            List<String> recoveryCodes = firebaseMfaService.generateRecoveryCodes(user.getId());
            securityAuditService.logMfaEnrolled(user.getUsername(), PhoneFirebaseFactorHandler.FACTOR_TYPE, request);

            MfaStatusResponse response = new MfaStatusResponse(
                    true,
                    PhoneFirebaseFactorHandler.FACTOR_TYPE,
                    firebaseMfaService.maskPhone(verifiedPhone),
                    recoveryCodes.size()
            );
            response.setRecoveryCodes(recoveryCodes);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Failed to enroll in MFA: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(error("Internal Server Error", "MFA enrollment failed: " + e.getMessage(), 500));
        }
    }

    /**
     * Disable MFA for authenticated user (requires current password confirmation).
     */
    @PostMapping("/disable")
    public ResponseEntity<?> disableMfa(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Unauthorized", "Authentication required", 401));
        }

        String password = payload.get("password");
        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Unauthorized", "Incorrect password confirmation.", 401));
        }

        user.setMfaEnabled(false);
        user.setMfaFactor(null);
        userRepository.save(user);

        securityAuditService.logMfaDisabled(user.getUsername(), request);
        return ResponseEntity.ok(Map.of("success", true, "message", "MFA has been successfully disabled."));
    }

    /**
     * Re-generate 10 emergency recovery codes (requires current password confirmation).
     */
    @PostMapping("/regenerate-recovery-codes")
    public ResponseEntity<?> regenerateRecoveryCodes(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Unauthorized", "Authentication required", 401));
        }

        String password = payload.get("password");
        if (password == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error("Unauthorized", "Incorrect password confirmation.", 401));
        }

        List<String> recoveryCodes = firebaseMfaService.generateRecoveryCodes(user.getId());
        return ResponseEntity.ok(Map.of("recoveryCodes", recoveryCodes, "count", recoveryCodes.size()));
    }

    private ResponseEntity<?> completeLogin(User user, String factor, HttpServletRequest request) {
        String token = jwtUtils.generateToken(user.getUsername(), user.getRole());
        String refreshToken = UUID.randomUUID().toString();
        AuthController.storeRefreshToken(refreshToken, user.getUsername(), LocalDateTime.now().plusDays(7));

        securityAuditService.logMfaSuccess(user.getUsername(), factor, request);
        securityAuditService.logLoginSuccess(user.getUsername(), request);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("name", user.getName());
        response.put("refreshToken", refreshToken);
        response.put("forcePasswordChange", user.getForcePasswordChange() != null && user.getForcePasswordChange());

        return ResponseEntity.ok(response);
    }

    private User getAuthenticatedUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (!jwtUtils.isPreAuthToken(token)) {
                try {
                    String username = jwtUtils.extractUsername(token);
                    if (username != null) {
                        return userRepository.findByUsernameIgnoreCase(username).orElse(null);
                    }
                } catch (Exception ignored) {}
            }
        }
        return null;
    }
}
