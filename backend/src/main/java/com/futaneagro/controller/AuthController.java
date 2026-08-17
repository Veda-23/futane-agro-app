package com.futaneagro.controller;

import com.futaneagro.entity.User;
import com.futaneagro.repository.UserRepository;
import com.futaneagro.security.JwtUtils;
import com.futaneagro.service.EmailService;
import com.futaneagro.service.SmsService;
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

    private static class OtpDetails {
        String hashedCode;
        LocalDateTime expiry;

        OtpDetails(String hashedCode, LocalDateTime expiry) {
            this.hashedCode = hashedCode;
            this.expiry = expiry;
        }
    }

    private static class RateLimitEntry {
        AtomicInteger count = new AtomicInteger(0);
        long windowStartTime = System.currentTimeMillis();
    }

    private static final Map<String, OtpDetails> otpCache = new ConcurrentHashMap<>();
    private static final Map<String, RateLimitEntry> rateLimitCache = new ConcurrentHashMap<>();
    private static final int RATE_LIMIT_MAX_ATTEMPTS = 10;
    private static final long RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

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

    private boolean isRateLimited(HttpServletRequest request) {
        String ip = getClientIp(request);
        long now = System.currentTimeMillis();
        RateLimitEntry entry = rateLimitCache.compute(ip, (k, v) -> {
            if (v == null || (now - v.windowStartTime) > RATE_LIMIT_WINDOW_MS) {
                RateLimitEntry newEntry = new RateLimitEntry();
                newEntry.count.set(1);
                newEntry.windowStartTime = now;
                return newEntry;
            } else {
                v.count.incrementAndGet();
                return v;
            }
        });
        return entry.count.get() > RATE_LIMIT_MAX_ATTEMPTS;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isEmpty()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private Map<String, Object> createErrorResponse(String error, String message, int status) {
        Map<String, Object> map = new HashMap<>();
        map.put("error", error);
        map.put("message", message);
        map.put("status", status);
        return map;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletRequest request) {
        if (isRateLimited(request)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                createErrorResponse("Too Many Requests", "Too many login attempts. Please wait 60 seconds.", 429)
            );
        }

        String rawUsername = credentials.get("username");
        String password = credentials.get("password");

        if (rawUsername == null || password == null) {
            return ResponseEntity.badRequest().body(
                createErrorResponse("Bad Request", "Username and password are required.", 400)
            );
        }

        // Case-insensitive username lookup
        String username = rawUsername.trim();
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                createErrorResponse("Unauthorized", "Invalid username or password.", 401)
            );
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
                    createErrorResponse("Forbidden", "Account is locked due to 5 failed attempts. Locked for 30 minutes.", 403)
                );
            }
        }

        // Verify password
        if (passwordEncoder.matches(password, user.getPassword())) {
            // Reset attempts on successful password verification
            user.setFailedAttempts(0);
            user.setAccountLocked(false);
            user.setLockTime(null);
            userRepository.save(user);

            // Generate 6-digit OTP
            String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
            String hashedOtp = passwordEncoder.encode(otp);

            // Use actual username from DB as cache key (consistent case)
            String cacheKey = user.getUsername();
            otpCache.put(cacheKey, new OtpDetails(hashedOtp, LocalDateTime.now().plusMinutes(15)));

            System.out.println("========================================");
            System.out.println("🔐 GENERATED OTP FOR " + cacheKey + ": " + otp);
            System.out.println("========================================");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "OTP_REQUIRED");
            response.put("username", cacheKey);

            if (isProductionProfile()) {
                // Production: try to send email/SMS but never fail the login if they throw
                if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                    try {
                        emailService.sendOtpEmail(user.getEmail(), otp, user.getName());
                    } catch (Exception e) {
                        System.out.println("⚠️  Email OTP failed (non-fatal): " + e.getMessage());
                    }
                }
                if (user.getMobileNumber() != null && !user.getMobileNumber().isEmpty()) {
                    try {
                        smsService.sendOtpSms(user.getMobileNumber(), otp);
                    } catch (Exception e) {
                        System.out.println("⚠️  SMS OTP failed (non-fatal): " + e.getMessage());
                    }
                }
                // Return tempOtp for local / UI verification
                response.put("tempOtp", otp);
            } else {
                // UAT: try email but non-fatal; always return tempOtp for ease of testing
                if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                    try {
                        emailService.sendOtpEmail(user.getEmail(), otp, user.getName());
                    } catch (Exception e) {
                        System.out.println("⚠️  UAT Email OTP failed (non-fatal): " + e.getMessage());
                    }
                }
                response.put("tempOtp", otp);
            }

            return ResponseEntity.ok(response);

        } else {
            // Failed attempt
            int attempts = (user.getFailedAttempts() != null) ? user.getFailedAttempts() + 1 : 1;
            user.setFailedAttempts(attempts);
            if (attempts >= 5) {
                user.setAccountLocked(true);
                user.setLockTime(LocalDateTime.now());
            }
            userRepository.save(user);

            if (attempts >= 5) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    createErrorResponse("Forbidden", "Too many failed attempts. Account has been locked for 30 minutes.", 403)
                );
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                createErrorResponse("Unauthorized", "Invalid username or password. Attempts remaining: " + (5 - attempts), 401)
            );
        }
    }

    @PostMapping("/login/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        if (isRateLimited(request)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                createErrorResponse("Too Many Requests", "Too many verification attempts. Please wait 60 seconds.", 429)
            );
        }

        try {
            String rawUsername = payload.get("username");
            String otp = payload.get("otp");

            if (rawUsername == null || otp == null) {
                return ResponseEntity.badRequest().body(
                    createErrorResponse("Bad Request", "Username and OTP are required.", 400)
                );
            }

            // Case-insensitive OTP cache lookup
            String username = rawUsername.trim();
            OtpDetails cached = otpCache.get(username);
            if (cached == null) {
                cached = otpCache.get(username.toUpperCase());
                if (cached != null) username = username.toUpperCase();
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

            if (cached == null || cached.expiry.isBefore(LocalDateTime.now()) || !passwordEncoder.matches(otp.trim(), cached.hashedCode)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    createErrorResponse("Unauthorized", "Invalid or expired OTP. Please request a new one.", 401)
                );
            }

            // OTP verified successfully. Remove from cache
            otpCache.remove(username);

            Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username);
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    createErrorResponse("Unauthorized", "User not found.", 401)
                );
            }
            User user = userOpt.get();

            // Generate JWT Token
            String token = jwtUtils.generateToken(user.getUsername(), user.getRole());

            // Create response payload
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("name", user.getName());
            response.put("refreshToken", "refresh-" + user.getUsername() + "-" + System.currentTimeMillis());
            response.put("forcePasswordChange", user.getForcePasswordChange() != null && user.getForcePasswordChange());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                createErrorResponse("Internal Server Error", "An error occurred while verifying OTP: " + e.getMessage(), 500)
            );
        }
    }

    @GetMapping("/verify-session")
    public ResponseEntity<?> verifySession(@CookieValue(value = "erp_session_cookie", required = false) String token,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String jwtToken = token;
        if (jwtToken == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            jwtToken = authHeader.substring(7);
        }

        if (jwtToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                createErrorResponse("Unauthorized", "No session token provided", 401)
            );
        }

        try {
            String username = jwtUtils.extractUsername(jwtToken);
            if (jwtUtils.validateToken(jwtToken, username)) {
                Map<String, Object> resp = new HashMap<>();
                resp.put("status", "VALID");
                resp.put("username", username);
                return ResponseEntity.ok(resp);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                createErrorResponse("Unauthorized", "Invalid session token", 401)
            );
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            createErrorResponse("Unauthorized", "Invalid session token", 401)
        );
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
    public ResponseEntity<?> updateUser(@PathVariable String username, @RequestBody Map<String, Object> updates) {
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
        if (updates.containsKey("password") && updates.get("password") != null && ((String) updates.get("password")).trim().length() > 0) {
            user.setPassword(passwordEncoder.encode((String) updates.get("password")));
        }
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        if (!userRepository.existsById(username)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(username);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> req, HttpServletRequest httpReq) {
        String username = req.get("username");
        String currentPassword = req.get("currentPassword");
        String newPassword = req.get("newPassword");

        if (username == null || currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Bad Request", "Username, current password, and new password are required.", 400));
        }

        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(username.trim());
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Not Found", "User not found.", 404));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Unauthorized", "Current password is incorrect.", 401));
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(createErrorResponse("Bad Request", "New password must be at least 8 characters.", 400));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setForcePasswordChange(false);
        userRepository.save(user);

        Map<String, Object> res = new HashMap<>();
        res.put("message", "Password changed successfully.");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && tokenBlacklistService != null) {
            tokenBlacklistService.blacklistToken(authHeader);
        }
        Map<String, Object> res = new HashMap<>();
        res.put("message", "Logged out successfully and token invalidated.");
        return ResponseEntity.ok(res);
    }
}
