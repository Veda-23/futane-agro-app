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

/**
 * <h3>Multi-Factor Authentication (MFA / 2FA) REST Controller</h3>
 * <p>
 * Manages second-factor identity verification using Firebase Phone SMS OTP and cryptographic
 * backup recovery codes for securing privileged user sessions across the Futane Agro ERP platform.
 * </p>
 *
 * <h4>MFA Authentication Protocol:</h4>
 * <ol>
 *   <li><b>Step 1 (Primary Credentials):</b> In {@link AuthController#login}, valid username/password triggers
 *       issuance of a short-lived Pre-Authentication JWT ({@code preAuthToken}, TTL 5 minutes) if 2FA is active.</li>
 *   <li><b>Step 2 (Secondary Factor):</b> The frontend verifies OTP via Firebase client SDK and posts the
 *       {@code firebaseIdToken} here at {@code /verify-firebase-otp}.</li>
 *   <li><b>Alternative Step 2 (Emergency Fallback):</b> If SMS fails, user submits a single-use
 *       hashed backup recovery code at {@code /verify-recovery-code}.</li>
 *   <li><b>Session Upgrade:</b> Upon successful secondary factor validation, full-privileged ERP JWT and
 *       refresh token are minted and returned.</li>
 * </ol>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
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
     * <b>POST /api/users/mfa/verify-firebase-otp</b> - Step 2: Verifies Firebase SMS ID Token and mints standard ERP JWT.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Verifies client rate limit to defend against brute force attempts.</li>
     *   <li>Validates signature and expiry of the {@code preAuthToken}.</li>
     *   <li>Resolves the user entity and calls {@link FirebaseMfaService#verifyFirebaseIdToken(User, String)}.</li>
     *   <li>Confirms phone number in Firebase ID Token matches the user's enrolled phone.</li>
     *   <li>Promotes session to full authentication, mints ERP JWT and refresh token, and logs audit success.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Completing 2FA login when SMS OTP is entered by the user.
     * </p>
     *
     * @param req Request body containing {@code preAuthToken} and {@code firebaseIdToken}
     * @param request HTTP request for audit logging and IP rate limiting
     * @return 200 OK with full ERP token and user profile, or 401/429 on failure
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
     * <b>POST /api/users/mfa/verify-recovery-code</b> - Step 2 Fallback: Verifies a single-use emergency recovery code.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Verifies client rate limit to defend against brute force attempts.</li>
     *   <li>Validates signature and expiry of the {@code preAuthToken}.</li>
     *   <li>Resolves user and executes constant-time hash comparison against stored unused recovery codes.</li>
     *   <li>Marks the matching code as consumed (single-use invariant).</li>
     *   <li>Logs recovery code usage event and promotes session to full authentication.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Emergency system login when user has lost SMS access or phone network is down.
     * </p>
     *
     * @param req Request containing {@code preAuthToken} and plaintext {@code recoveryCode}
     * @param request HTTP servlet request for audit logging and IP rate limiting
     * @return 200 OK with full ERP token and user profile, or 401/429 on failure
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
     * <b>GET /api/users/mfa/status</b> - Retrieves current authenticated user's MFA enrollment status.
     * <p>
     * <b>How it works:</b>
     * Resolves authenticated user from standard JWT, checks whether MFA is enabled,
     * returns masked phone number (e.g. {@code +91 98****1234}), factor type, and count of remaining recovery codes.
     * </p>
     * <p>
     * <b>Used for:</b> The User Profile & Security settings panel in the frontend.
     * </p>
     *
     * @param request HTTP servlet request carrying Bearer token
     * @return 200 OK with {@link MfaStatusResponse}, or 401 Unauthorized
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
     * <b>POST /api/users/mfa/enroll</b> - Enrolls the authenticated user into Firebase Phone MFA.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Verifies authenticated session from request header.</li>
     *   <li>Validates the Firebase ID token cryptographically with {@link FirebaseAuth} to ensure phone ownership.</li>
     *   <li>Extracts and normalizes phone number to E.164 standard.</li>
     *   <li>Enables MFA on the user record in PostgreSQL.</li>
     *   <li>Generates and returns 10 single-use emergency backup recovery codes.</li>
     *   <li>Logs enrollment security audit event.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> Initial 2FA setup in user security preferences.
     * </p>
     *
     * @param req Enrollment payload with verified {@code firebaseIdToken}
     * @param request HTTP servlet request for security auditing
     * @return 200 OK with newly minted recovery codes, or 400/401/500 on error
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
     * <b>POST /api/users/mfa/disable</b> - Disables MFA for the authenticated user.
     * <p>
     * <b>Security Guardrail:</b> Requires re-entering current user password to prevent unauthorized disabling
     * from unattended workstations.
     * </p>
     * <p>
     * <b>Used for:</b> Opting out of 2FA in user account settings.
     * </p>
     *
     * @param payload Map containing {@code "password"} confirmation
     * @param request HTTP servlet request
     * @return 200 OK on success, or 401 on password mismatch
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
     * <b>POST /api/users/mfa/regenerate-recovery-codes</b> - Replaces all existing backup codes with 10 new codes.
     * <p>
     * <b>Security Guardrail:</b> Requires current password confirmation.
     * </p>
     * <p>
     * <b>Used for:</b> Refreshing recovery codes after consuming previous ones or if exposure is suspected.
     * </p>
     *
     * @param payload Map containing {@code "password"} confirmation
     * @param request HTTP servlet request
     * @return 200 OK with 10 newly minted recovery codes, or 401 on incorrect password
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
        if (rateLimitingService != null) {
            String clientIp = rateLimitingService.getClientIp(request);
            rateLimitingService.reset(clientIp, RateLimitingService.Action.OTP_VERIFY);
            rateLimitingService.reset(clientIp, RateLimitingService.Action.LOGIN);
        }

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
