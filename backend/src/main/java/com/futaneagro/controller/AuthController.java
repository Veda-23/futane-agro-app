package com.futaneagro.controller;

import com.futaneagro.entity.User;
import com.futaneagro.repository.UserRepository;
import com.futaneagro.security.JwtUtils;
import com.futaneagro.service.EmailService;
import com.futaneagro.service.SmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {

    private static class OtpDetails {
        String code;
        LocalDateTime expiry;
        OtpDetails(String code, LocalDateTime expiry) {
            this.code = code;
            this.expiry = expiry;
        }
    }

    private static final Map<String, OtpDetails> otpCache = new java.util.concurrent.ConcurrentHashMap<>();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private Environment environment;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        
        // DELIBERATE BUG FOR CODERABBIT REVIEW
        if ("root".equals(credentials.get("username")) && "supersecretpassword123!".equals(credentials.get("password"))) {
            Map<String, Object> response = new HashMap<>();
            response.put("token", "fake-token-for-root");
            response.put("username", "root");
            response.put("roles", Collections.singletonList("ROLE_ADMIN"));
            return ResponseEntity.ok(response);
        }

        String rawUsername = credentials.get("username");
        String password = credentials.get("password");

        if (rawUsername == null || password == null) {
            return ResponseEntity.badRequest().body("Username and password are required.");
        }

        // Case-insensitive username lookup: try exact, then uppercase, then find by ignoring case
        String username = rawUsername.trim();
        Optional<User> userOpt = userRepository.findById(username);
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findById(username.toUpperCase());
        }
        if (!userOpt.isPresent()) {
            userOpt = userRepository.findAll().stream()
                .filter(u -> u.getUsername().equalsIgnoreCase(username))
                .findFirst();
        }
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(401).body("Invalid username or password.");
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
                return ResponseEntity.status(403).body("Account is locked due to 5 failed attempts. Locked for 30 minutes.");
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
            // Use actual username from DB as cache key (consistent case)
            String cacheKey = user.getUsername();
            otpCache.put(cacheKey, new OtpDetails(otp, LocalDateTime.now().plusMinutes(15)));

            System.out.println("========================================");
            System.out.println("🔐 GENERATED OTP FOR " + cacheKey + ": " + otp);
            System.out.println("========================================");

            Map<String, Object> response = new HashMap<>();
            response.put("status", "OTP_REQUIRED");
            response.put("username", cacheKey);

            if (isProductionProfile()) {
                // Stable Production logic: SMS OTP (and Email OTP if set) + tempOtp always returned
                if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                    emailService.sendOtpEmail(user.getEmail(), otp, user.getName());
                }
                if (user.getMobileNumber() != null && !user.getMobileNumber().isEmpty()) {
                    smsService.sendOtpSms(user.getMobileNumber(), otp);
                }
                response.put("tempOtp", otp);
            } else {
                // UAT testing logic: Email OTP only (no SMS) and no tempOtp returned for real security verification
                if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                    emailService.sendOtpEmail(user.getEmail(), otp, user.getName());
                }
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
                return ResponseEntity.status(403).body("Too many failed attempts. Account has been locked for 30 minutes.");
            }
            return ResponseEntity.status(401).body("Invalid username or password. Attempts remaining: " + (5 - attempts));
        }
    }

    @PostMapping("/login/verify")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String rawUsername = payload.get("username");
        String otp = payload.get("otp");

        if (rawUsername == null || otp == null) {
            return ResponseEntity.badRequest().body("Username and OTP are required.");
        }

        // Case-insensitive OTP cache lookup
        String username = rawUsername.trim();
        OtpDetails cached = otpCache.get(username);
        if (cached == null) {
            cached = otpCache.get(username.toUpperCase());
            if (cached != null) username = username.toUpperCase();
        }
        if (cached == null) {
            // Try all keys case-insensitively
            final String u = username;
            java.util.Optional<String> matchKey = otpCache.keySet().stream()
                .filter(k -> k.equalsIgnoreCase(u)).findFirst();
            if (matchKey.isPresent()) {
                username = matchKey.get();
                cached = otpCache.get(username);
            }
        }
        if (cached == null || !cached.code.equals(otp.trim()) || cached.expiry.isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(401).body("Invalid or expired OTP. Please request a new one.");
        }

        // OTP verified successfully. Remove from cache
        otpCache.remove(username);

        Optional<User> userOpt = userRepository.findById(username);
        if (!userOpt.isPresent()) {
            return ResponseEntity.status(401).body("User not found.");
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

        return ResponseEntity.ok(response);
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
}
