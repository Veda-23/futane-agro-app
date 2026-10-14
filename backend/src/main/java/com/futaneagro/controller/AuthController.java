package com.futaneagro.controller;

import com.futaneagro.entity.User;
import com.futaneagro.repository.UserRepository;
import com.futaneagro.security.JwtUtils;
import com.futaneagro.service.EmailService;
import com.futaneagro.service.SmsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/users")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private static class OtpDetails {
        String hashedCode;
        LocalDateTime expiry;

        OtpDetails(String hashedCode, LocalDateTime expiry) {
            this.hashedCode = hashedCode;
            this.expiry = expiry;
        }
    }

    private static class RefreshTokenDetails {
        String username;
        LocalDateTime expiry;

        RefreshTokenDetails(String username, LocalDateTime expiry) {
            this.username = username;
            this.expiry = expiry;
        }
    }

    private static final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();
    private static final Map<String, RefreshTokenDetails> refreshTokenCache = new ConcurrentHashMap<>();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private Environment environment;

    @Autowired
    private com.futaneagro.security.TokenBlacklistService tokenBlacklistService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

    @Autowired
    private com.futaneagro.security.SecurityAuditService securityAuditService;

    @Autowired
    private com.futaneagro.security.RateLimitingService rateLimitingService;

    private Map<String, Object> createErrorResponse(String error, String message, int status) {
        Map<String, Object> map = new HashMap<>();
        map.put("error", error);
        map.put("message", message);
        map.put("status", status);
        return map;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletRequest request) {
        try {
            if (rateLimitingService.isRateLimited(request, com.futaneagro.security.RateLimitingService.Action.LOGIN)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                        createErrorResponse("Too Many Requests", "Too many login attempts. Please wait 60 seconds.", 429));
            }

            String rawUsername = credentials.get("username");
            String password = credentials.get("password");

            if (rawUsername == null || password == null) {
                return ResponseEntity.badRequest().body(
                        createErrorResponse("Bad Request", "Username and password are required.", 400));
            }

            // Case-insensitive username lookup with email and alias fallbacks
            String username = rawUsername.trim();
            Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
            if (!userOpt.isPresent()) {
                userOpt = userRepository.findByEmailIgnoreCase(username);
            }
            if (!userOpt.isPresent() && (username.equalsIgnoreCase("vedant") || username.equalsIgnoreCase("vedant.mehare") || username.equalsIgnoreCase("vedant futane") || username.equalsIgnoreCase("superadmin"))) {
                userOpt = userRepository.findByUsernameIgnoreCase("SUPER_ADMIN");
            }
            if (!userOpt.isPresent()) {
                securityAuditService.logLoginFailed(username, "User not found", request);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        createErrorResponse("Unauthorized", "Invalid username or password.", 401));
            }

            User user = userOpt.get();

        // Check Brute Force Lockout
        if (user.getAccountLocked() != null && user.getAccountLocked()) {
            if (user.getLockTime() != null && user.getLockTime().plusMinutes(30).isBefore(LocalDateTime.now())) {
                // Lock expired - unlock account
                user.setAccountLocked(false);
                user.setFailedAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        createErrorResponse("Forbidden",
                                "Account is locked due to 5 failed attempts. Locked for 30 minutes.", 403));
            }
        }

        // Verify password: Strictly enforce cryptographic BCrypt hash comparison (Zero fallbacks / hardcoded credentials)
        boolean passwordMatches = passwordEncoder.matches(password, user.getPassword());

        if (passwordMatches) {
            // Reset attempts on successful password verification
            user.setFailedAttempts(0);
            user.setAccountLocked(false);
            user.setLockTime(null);
            userRepository.save(user);

            // Generate cryptographically secure 6-digit OTP
            String otp = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
            String hashedOtp = passwordEncoder.encode(otp);

            // Use actual username from DB as cache key (consistent case)
            String cacheKey = user.getUsername();
            // OTP expiry: 5 minutes (industry standard — down from 15min)
            otpCache.put(cacheKey, new OtpDetails(hashedOtp, LocalDateTime.now().plusMinutes(5)));

            // SECURITY: Never log raw OTP in production
            if (!isProductionProfile()) {
                logger.info("🔐 [DEV/UAT ONLY] OTP for {}: {}", cacheKey, otp);
            } else {
                logger.info("OTP generated for user: {} (suppressed for security)", cacheKey);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("username", cacheKey);

            if (isProductionProfile()) {
                // ── PRODUCTION ── OTP is NEVER returned in the API response body.
                // Delivery via email and/or SMS only. Fail securely if both unavailable.
                boolean delivered = false;

                if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                    try {
                        emailService.sendOtpEmail(user.getEmail(), otp, user.getName());
                        delivered = true;
                    } catch (Exception e) {
                        logger.error("Failed to send OTP email to user: {} — {}", cacheKey, e.getMessage());
                    }
                }
                if (user.getMobileNumber() != null && !user.getMobileNumber().isEmpty()) {
                    try {
                        smsService.sendOtpSms(user.getMobileNumber(), otp);
                        delivered = true;
                    } catch (Exception e) {
                        logger.warn("Failed to send OTP SMS to user: {} — {}", cacheKey, e.getMessage());
                    }
                }

                if (!delivered) {
                    // Cannot deliver OTP via any channel — fail securely
                    logger.error("OTP delivery failed for user: {} — no email or SMS configured", cacheKey);
                    otpCache.remove(cacheKey); // Clean up undeliverable OTP
                    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                            createErrorResponse("Service Unavailable",
                                    "Unable to deliver OTP. Please contact your administrator.", 503));
                }

                // ⚠ tempOtp is intentionally ABSENT from PROD response
                response.put("status", "OTP_SENT");
                response.put("hint", "OTP sent to your registered email/mobile");

            } else {
                // ── UAT / DEV ── Return tempOtp in response for testing convenience
                if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                    try {
                        emailService.sendOtpEmail(user.getEmail(), otp, user.getName());
                    } catch (Exception e) {
                        logger.warn("UAT email OTP failed (non-fatal): {}", e.getMessage());
                    }
                }
                response.put("status", "OTP_REQUIRED");
                response.put("tempOtp", otp); // UAT only — never in PROD
            }

            return ResponseEntity.ok(response);

        } else {
            // Failed attempt
            int attempts = (user.getFailedAttempts() != null) ? user.getFailedAttempts() + 1 : 1;
            user.setFailedAttempts(attempts);
            if (attempts >= 5) {
                user.setAccountLocked(true);
                user.setLockTime(LocalDateTime.now());
                securityAuditService.logAccountLocked(user.getUsername(), attempts, request);
            } else {
                securityAuditService.logLoginFailed(user.getUsername(), "Incorrect password", request);
            }
            userRepository.save(user);

            if (attempts >= 5) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        createErrorResponse("Forbidden",
                                "Too many failed attempts. Account has been locked for 30 minutes.", 403));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    createErrorResponse("Unauthorized",
                            "Invalid username or password. Attempts remaining: " + (5 - attempts), 401));
            }
        } catch (Throwable t) {
            logger.error("Error during login for {}: {}", credentials.get("username"), t.getMessage(), t);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Internal Server Error", "Login exception: " + t.getMessage(), 500));
        }
    }

    @PostMapping("/login/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        if (rateLimitingService.isRateLimited(request, com.futaneagro.security.RateLimitingService.Action.OTP_VERIFY)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    createErrorResponse("Too Many Requests", "Too many verification attempts. Please wait 60 seconds.",
                            429));
        }

        try {
            String rawUsername = payload.get("username");
            String otp = payload.get("otp");

            if (rawUsername == null || otp == null) {
                return ResponseEntity.badRequest().body(
                        createErrorResponse("Bad Request", "Username and OTP are required.", 400));
            }

            // Case-insensitive OTP cache lookup
            String username = rawUsername.trim();
            OtpDetails cached = otpCache.get(username);
            if (cached == null) {
                cached = otpCache.get(username.toUpperCase());
                if (cached != null)
                    username = username.toUpperCase();
            }
            if (cached == null) {
                final String u = username;
                Optional<String> matchKey = otpCache.keySet().stream()
                        .filter(k -> k.equalsIgnoreCase(u)).findFirst();
                if (matchKey.isPresent()) {
                    username = matchKey.get();
                    cached = otpCache.get(username);
                }
            }

            // Zero-Trust OTP: Strictly require valid, unexpired, BCrypt-matching cryptographic OTP (Zero static bypasses)
            boolean otpValid = (cached != null && !cached.expiry.isBefore(LocalDateTime.now()) && passwordEncoder.matches(otp.trim(), cached.hashedCode));

            if (!otpValid) {
                securityAuditService.logOtpFailed(username, request);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        createErrorResponse("Unauthorized", "Invalid or expired OTP. Please request a new one.", 401));
            }

            // OTP verified successfully. Remove from cache
            otpCache.remove(username);

            Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
            if (!userOpt.isPresent()) {
                userOpt = userRepository.findByEmailIgnoreCase(username);
            }
            if (!userOpt.isPresent() && (username.equalsIgnoreCase("vedant") || username.equalsIgnoreCase("vedant.mehare") || username.equalsIgnoreCase("vedant futane") || username.equalsIgnoreCase("superadmin"))) {
                userOpt = userRepository.findByUsernameIgnoreCase("SUPER_ADMIN");
            }
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        createErrorResponse("Unauthorized", "User not found.", 401));
            }
            User user = userOpt.get();

            // Generate JWT Token
            String token = jwtUtils.generateToken(user.getUsername(), user.getRole());

            // Log successful login audit
            securityAuditService.logLoginSuccess(user.getUsername(), request);

            // Issue cryptographically secure refresh token (UUID) valid for 7 days
            String refreshToken = java.util.UUID.randomUUID().toString();
            refreshTokenCache.put(refreshToken, new RefreshTokenDetails(user.getUsername(), LocalDateTime.now().plusDays(7)));

            // Create response payload
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("name", user.getName());
            response.put("refreshToken", refreshToken);
            response.put("forcePasswordChange", user.getForcePasswordChange() != null && user.getForcePasswordChange());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("OTP verification internal error: type={} message={}", e.getClass().getSimpleName(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Internal Server Error",
                            "An error occurred while verifying OTP. Please try again.", 500));
        }
    }

    @GetMapping("/verify-session")
    public ResponseEntity<?> verifySession(@CookieValue(value = "erp_session_cookie", required = false) String token,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest request) {
        if (rateLimitingService != null && rateLimitingService.isRateLimited(request, com.futaneagro.security.RateLimitingService.Action.SESSION_VERIFY)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    createErrorResponse("Too Many Requests", "Too many session verification attempts. Please wait 60 seconds.", 429));
        }

        String jwtToken = token;
        if (jwtToken == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            jwtToken = authHeader.substring(7);
        }

        if (jwtToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    createErrorResponse("Unauthorized", "No session token provided", 401));
        }

        if (tokenBlacklistService != null && tokenBlacklistService.isBlacklisted(jwtToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    createErrorResponse("Unauthorized", "Session token has been revoked. Please log in again.", 401));
        }
        try {
            String username = jwtUtils.extractUsername(jwtToken);
            if (jwtUtils.validateToken(jwtToken, username)) {
                String role = jwtUtils.extractClaim(jwtToken, claims -> claims.get("role", String.class));
                Optional<User> uOpt = userRepository.findByUsernameIgnoreCase(username);
                Map<String, Object> resp = new HashMap<>();
                resp.put("status", "VALID");
                resp.put("username", username);
                resp.put("role", role != null ? role : (uOpt.isPresent() ? uOpt.get().getRole() : "VIEWER"));
                if (uOpt.isPresent()) {
                    User u = uOpt.get();
                    if (Boolean.TRUE.equals(u.getAccountLocked())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                                createErrorResponse("Forbidden", "Account is locked due to security policy.", 403));
                    }
                    Map<String, Object> uData = new HashMap<>();
                    uData.put("id", u.getId());
                    uData.put("username", u.getUsername());
                    uData.put("name", u.getName());
                    uData.put("role", u.getRole());
                    uData.put("email", u.getEmail());
                    resp.put("user", uData);
                } else {
                    Map<String, Object> uData = new HashMap<>();
                    uData.put("username", username);
                    uData.put("role", role);
                    uData.put("name", username);
                    resp.put("user", uData);
                }
                return ResponseEntity.ok(resp);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    createErrorResponse("Unauthorized", "Invalid session token", 401));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                createErrorResponse("Unauthorized", "Invalid session token", 401));
    }

    private boolean isProductionProfile() {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @PutMapping("/{username}")
    public ResponseEntity<?> updateUser(@PathVariable("username") String username, @RequestBody Map<String, Object> updates) {
        Optional<User> userOpt = userRepository.findById(username);
        if (!userOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        if (updates.containsKey("name")) {
            user.setName((String) updates.get("name"));
        }
        if (updates.containsKey("role")) {
            user.setRole((String) updates.get("role"));
        }
        if (updates.containsKey("email")) {
            user.setEmail((String) updates.get("email"));
        }
        if (updates.containsKey("accountLocked")) {
            user.setAccountLocked((Boolean) updates.get("accountLocked"));
            if (Boolean.TRUE.equals(updates.get("accountLocked"))) {
                user.setLockTime(LocalDateTime.now());
            } else {
                user.setLockTime(null);
                user.setFailedAttempts(0);
            }
        }
        if (updates.containsKey("password") && updates.get("password") != null
                && ((String) updates.get("password")).trim().length() > 0) {
            user.setPassword(passwordEncoder.encode((String) updates.get("password")));
        }
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable("username") String username) {
        if (!userRepository.existsById(username)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(username);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        if (rateLimitingService.isRateLimited(request, com.futaneagro.security.RateLimitingService.Action.REFRESH_TOKEN)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(createErrorResponse("Too Many Requests", "Too many refresh attempts. Please wait 60 seconds.", 429));
        }

        String refreshToken = payload.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Bad Request", "Refresh token is required.", 400));
        }

        RefreshTokenDetails details = refreshTokenCache.get(refreshToken);
        if (details == null || details.expiry.isBefore(LocalDateTime.now())) {
            if (details != null) refreshTokenCache.remove(refreshToken);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized", "Invalid or expired refresh token.", 401));
        }

        // Token rotation: invalidate used refresh token and issue a fresh pair
        refreshTokenCache.remove(refreshToken);

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(details.username);
        if (!userOpt.isPresent() || Boolean.TRUE.equals(userOpt.get().getAccountLocked())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized", "User account inactive or locked.", 401));
        }

        User user = userOpt.get();
        String newJwt = jwtUtils.generateToken(user.getUsername(), user.getRole());
        String newRefreshToken = java.util.UUID.randomUUID().toString();
        refreshTokenCache.put(newRefreshToken, new RefreshTokenDetails(user.getUsername(), LocalDateTime.now().plusDays(7)));

        Map<String, Object> resp = new HashMap<>();
        resp.put("token", newJwt);
        resp.put("refreshToken", newRefreshToken);
        resp.put("username", user.getUsername());
        resp.put("role", user.getRole());
        resp.put("name", user.getName());
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> req, HttpServletRequest httpReq) {
        if (rateLimitingService.isRateLimited(httpReq, com.futaneagro.security.RateLimitingService.Action.PASSWORD_CHANGE)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(createErrorResponse("Too Many Requests", "Too many password change attempts. Please wait 60 seconds.", 429));
        }

        String username = req.get("username");
        String currentPassword = req.get("currentPassword");
        String newPassword = req.get("newPassword");

        if (username == null || currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Bad Request",
                    "Username, current password, and new password are required.", 400));
        }

        // IDOR Protection: Caller must be the target user or a verified SUPER_ADMIN
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized", "Authentication required.", 401));
        }
        boolean isSuperAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equalsIgnoreCase(a.getAuthority()) || "SUPER_ADMIN".equalsIgnoreCase(a.getAuthority()));
        if (!isSuperAdmin && !auth.getName().equalsIgnoreCase(username.trim())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Forbidden", "Cannot change password for another user account.", 403));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username.trim());
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Not Found", "User not found.", 404));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Unauthorized", "Current password is incorrect.", 401));
        }

        // Hardened Password Policy: minimum 8 characters with letters and numbers/symbols
        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Bad Request", "New password must be at least 8 characters.", 400));
        }
        boolean hasLetter = newPassword.chars().anyMatch(c -> Character.isLetter((char) c));
        boolean hasDigitOrSpecial = newPassword.chars().anyMatch(c -> Character.isDigit((char) c) || !Character.isLetterOrDigit((char) c));
        if (!hasLetter || !hasDigitOrSpecial) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Bad Request", "New password must contain at least one letter and at least one digit or special character.", 400));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        // Security Fix: Invalidate all existing refresh tokens for this user upon password change
        final String u = user.getUsername();
        refreshTokenCache.entrySet().removeIf(e -> e.getValue().username.equalsIgnoreCase(u));

        // Blacklist current session token if present
        String authHeader = httpReq.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            long expiryMs = jwtUtils.getTokenExpiryMs(token);
            tokenBlacklistService.blacklistToken(token, expiryMs);
        }

        // Record immutable audit event
        securityAuditService.logPasswordChanged(user.getUsername(), httpReq);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Password changed successfully. Active sessions have been invalidated.");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            try {
                username = jwtUtils.extractUsername(token);
                // Use actual token expiry for precise TTL on blacklist entry
                long expiryMs = jwtUtils.getTokenExpiryMs(token);
                tokenBlacklistService.blacklistToken(token, expiryMs);
                securityAuditService.logLogout(username, request);
                // Clean up active refresh tokens for the user
                if (username != null) {
                    final String u = username;
                    refreshTokenCache.entrySet().removeIf(e -> e.getValue().username.equalsIgnoreCase(u));
                }
            } catch (Exception e) {
                // Token may already be expired — blacklist anyway with 24h TTL
                tokenBlacklistService.blacklistToken(authHeader);
                logger.warn("Logout: could not extract token claims (token may be expired): {}", e.getMessage());
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Logged out successfully.");
        res.put("tokenInvalidated", authHeader != null);
        return ResponseEntity.ok(res);
    }
}
