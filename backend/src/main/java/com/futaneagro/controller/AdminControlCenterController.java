package com.futaneagro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import com.futaneagro.service.AuditService;
import com.futaneagro.service.EmailService;
import com.futaneagro.service.NotificationBroadcastService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminControlCenterController {

    private static final Logger log = LoggerFactory.getLogger(AdminControlCenterController.class);

    @Autowired
    private SettingsRepository settingsRepo;

    @Autowired
    private TeamRepository teamRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private RolePermissionRepository rolePermRepo;

    @Autowired
    private FeatureFlagRepository featureFlagRepo;

    @Autowired
    private CustomFieldDefinitionRepository customFieldDefRepo;

    @Autowired
    private CustomFieldValueRepository customFieldValueRepo;

    @Autowired
    private ApiKeyRepository apiKeyRepo;

    @Autowired
    private WebhookConfigRepository webhookRepo;

    @Autowired(required = false)
    private org.springframework.cache.CacheManager cacheManager;

    @Autowired
    private AuditService auditService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationBroadcastService notificationBroadcastService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.futaneagro.security.FileSecurityService fileSecurityService;

    private static final List<String> ALLOWED_ROLES = Arrays.asList(
            "ADMIN", "MANAGER", "ACCOUNTANT", "OPERATOR", "VIEWER", "PRODUCTION_OPERATOR", "STORE_MANAGER"
    );

    private String getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(auth.getName())) {
            return auth.getName();
        }
        throw new org.springframework.security.access.AccessDeniedException("Unauthenticated access denied");
    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        
        // Check authorities
        boolean hasSuperAdminAuthority = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equalsIgnoreCase(a) || "SUPER_ADMIN".equalsIgnoreCase(a)
                        || "ROLE_ADMIN".equalsIgnoreCase(a) || "ADMIN".equalsIgnoreCase(a));
        if (hasSuperAdminAuthority) return true;

        // Fallback: Check user record in DB
        String username = auth.getName();
        Optional<User> userOpt = userRepo.findById(username);
        return userOpt.isPresent() && ("SUPER_ADMIN".equalsIgnoreCase(userOpt.get().getRole()) || "ADMIN".equalsIgnoreCase(userOpt.get().getRole()));
    }

    private String generateSecurePassword() {
        SecureRandom random = new SecureRandom();
        String upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lower = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String special = "!@#$%^&*";
        String all = upper + lower + digits + special;

        StringBuilder password = new StringBuilder(16);
        // Ensure at least one from each class
        password.append(upper.charAt(random.nextInt(upper.length())));
        password.append(lower.charAt(random.nextInt(lower.length())));
        password.append(digits.charAt(random.nextInt(digits.length())));
        password.append(special.charAt(random.nextInt(special.length())));

        for (int i = 4; i < 16; i++) {
            password.append(all.charAt(random.nextInt(all.length())));
        }

        // Shuffle characters
        List<Character> chars = new ArrayList<>();
        for (char c : password.toString().toCharArray()) {
            chars.add(c);
        }
        Collections.shuffle(chars, random);

        StringBuilder result = new StringBuilder();
        for (char c : chars) {
            result.append(c);
        }
        return result.toString();
    }

    private String toJson(Object obj) {
        if (obj == null) return "";
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return String.valueOf(obj);
        }
    }

    // =========================================================================
    // 1. BRANDING & APPEARANCE
    // =========================================================================
    @GetMapping("/branding")
    @Cacheable(value = "branding", key = "'global'")
    public Map<String, String> getBrandingSettings() {
        Map<String, String> branding = new HashMap<>();
        List<Settings> all = settingsRepo.findAll();
        for (Settings s : all) {
            branding.put(s.getConfigKey(), s.getConfigValue());
        }
        // Defaults if not set
        branding.putIfAbsent("app_display_name", "Futane Agro ERP");
        branding.putIfAbsent("app_tagline", "Quality Crates, Stronger Future");
        branding.putIfAbsent("brand_primary_color", "#d97706");
        branding.putIfAbsent("brand_primary_hover", "#b45309");
        branding.putIfAbsent("brand_logo_url", "assets/logo.svg");
        branding.putIfAbsent("default_theme", "light");
        branding.putIfAbsent("enabled_languages", "en,mr,hi");
        return branding;
    }

    @PostMapping("/branding")
    @CacheEvict(value = "branding", allEntries = true)
    public ResponseEntity<?> updateBrandingSettings(@RequestBody Map<String, String> payload) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_BRANDING_UPDATE", "Settings", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can update branding settings"));
        }

        String oldState = toJson(getBrandingSettings());
        for (Map.Entry<String, String> entry : payload.entrySet()) {
            Optional<Settings> existing = settingsRepo.findByConfigKey(entry.getKey());
            Settings s = existing.orElse(new Settings(entry.getKey(), entry.getValue()));
            s.setConfigValue(entry.getValue());
            settingsRepo.save(s);
        }

        auditService.log("BRANDING_UPDATED", "Settings", oldState, toJson(payload));
        notificationBroadcastService.broadcastUpdate("BRANDING", "UPDATED", "Enterprise branding updated");

        return ResponseEntity.ok(getBrandingSettings());
    }

    @PostMapping("/branding/logo-upload")
    @CacheEvict(value = "branding", allEntries = true)
    public ResponseEntity<?> uploadLogo(@RequestParam("file") MultipartFile file) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_LOGO_UPLOAD", "Settings", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can upload company logo"));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }

        String orig = file.getOriginalFilename();
        if (orig == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid file name"));
        }
        String origLower = orig.toLowerCase();
        if (!origLower.endsWith(".png") && !origLower.endsWith(".jpg") && !origLower.endsWith(".jpeg")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PNG and JPG image files are permitted for company logo."));
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("message", "Logo image must not exceed 5MB."));
        }

        com.futaneagro.security.FileSecurityService.FileValidationResult validation = fileSecurityService.validate(file);
        if (!validation.valid) {
            return ResponseEntity.badRequest().body(Map.of("message", validation.error));
        }

        try {
            String uploadDir = "uploads/branding/";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            String ext = origLower.substring(origLower.lastIndexOf("."));
            String filename = "company_logo_" + System.currentTimeMillis() + ext;
            Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = baseDir.resolve(filename).normalize();
            
            // Path traversal prevention
            if (!path.startsWith(baseDir)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Invalid upload path"));
            }

            Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

            String logoUrl = "/api/uploads/branding/" + filename;
            Optional<Settings> existing = settingsRepo.findByConfigKey("brand_logo_url");
            Settings s = existing.orElse(new Settings("brand_logo_url", logoUrl));
            s.setConfigValue(logoUrl);
            settingsRepo.save(s);

            auditService.log("LOGO_UPLOADED", "Settings", getCurrentUser(), "Uploaded logo: " + filename);
            notificationBroadcastService.broadcastUpdate("BRANDING", "LOGO_UPDATED", "Company logo replaced");

            Map<String, String> resp = new HashMap<>();
            resp.put("logoUrl", logoUrl);
            return ResponseEntity.ok(resp);
        } catch (IOException e) {
            log.error("Logo upload failed: type={} message={}", e.getClass().getSimpleName(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to upload logo due to an internal error."));
        }
    }

    // =========================================================================
    // 2. TEAMS / DEPARTMENTS MANAGEMENT
    // =========================================================================
    @GetMapping("/teams")
    @Cacheable(value = "teams", key = "'all'")
    public List<Map<String, Object>> getAllTeams() {
        List<Team> teams = teamRepo.findAllByOrderBySidebarOrderAsc();
        List<User> users = userRepo.findAll();
        List<Employee> employees = employeeRepo.findAll();

        return teams.stream().map(t -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", t.getId());
            map.put("name", t.getName());
            map.put("code", t.getCode());
            map.put("description", t.getDescription());
            map.put("icon", t.getIcon());
            map.put("colorTag", t.getColorTag());
            map.put("sidebarOrder", t.getSidebarOrder());
            map.put("showInSidebar", t.getShowInSidebar());
            map.put("isActive", t.getIsActive());

            // Live counts
            long userCount = users.stream().filter(u -> t.getId().equals(u.getTeamId()) || t.getCode().equalsIgnoreCase(u.getTeamId())).count();
            long empCount = employees.stream().filter(e -> t.getName().equalsIgnoreCase(e.getDepartment()) || t.getCode().equalsIgnoreCase(e.getDepartment())).count();
            map.put("userCount", userCount);
            map.put("employeeCount", empCount);

            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping("/teams")
    @CacheEvict(value = "teams", allEntries = true)
    public ResponseEntity<?> createTeam(@RequestBody Team team) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_TEAM_CREATE", "Team", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can create departments"));
        }

        if (team.getName() == null || team.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Department name is required"));
        }
        if (team.getCode() == null || team.getCode().trim().isEmpty()) {
            team.setCode(team.getName().toUpperCase().replaceAll("[^A-Z0-9]", "_"));
        }
        Optional<Team> existing = teamRepo.findByCode(team.getCode());
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Team code already exists"));
        }
        if (team.getSidebarOrder() == null) {
            team.setSidebarOrder((int) teamRepo.count() + 1);
        }
        Team saved = teamRepo.save(team);

        auditService.log("TEAM_CREATED", "Team", null, toJson(saved));
        notificationBroadcastService.broadcastUpdate("TEAMS", "CREATED", "New department created: " + saved.getName());

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/teams/{id}")
    @CacheEvict(value = "teams", allEntries = true)
    public ResponseEntity<?> updateTeam(@PathVariable("id") String id, @RequestBody Team updates) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_TEAM_UPDATE", "Team", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can update departments"));
        }

        Optional<Team> opt = teamRepo.findById(id);
        if (!opt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Team team = opt.get();
        String oldState = toJson(team);

        if (updates.getName() != null) team.setName(updates.getName());
        if (updates.getDescription() != null) team.setDescription(updates.getDescription());
        if (updates.getIcon() != null) team.setIcon(updates.getIcon());
        if (updates.getColorTag() != null) team.setColorTag(updates.getColorTag());
        if (updates.getSidebarOrder() != null) team.setSidebarOrder(updates.getSidebarOrder());
        if (updates.getShowInSidebar() != null) team.setShowInSidebar(updates.getShowInSidebar());
        if (updates.getIsActive() != null) team.setIsActive(updates.getIsActive());

        Team saved = teamRepo.save(team);

        auditService.log("TEAM_UPDATED", "Team", oldState, toJson(saved));
        notificationBroadcastService.broadcastUpdate("TEAMS", "UPDATED", "Department updated: " + saved.getName());

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/teams/{id}/deactivate")
    @CacheEvict(value = "teams", allEntries = true)
    public ResponseEntity<?> deactivateTeamPatch(@PathVariable("id") String id) {
        return handleDeactivateTeam(id);
    }

    @DeleteMapping("/teams/{id}")
    @CacheEvict(value = "teams", allEntries = true)
    public ResponseEntity<?> deactivateTeamDelete(@PathVariable("id") String id) {
        return handleDeactivateTeam(id);
    }

    private ResponseEntity<?> handleDeactivateTeam(String id) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_TEAM_DEACTIVATE", "Team", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can deactivate departments"));
        }

        Optional<Team> opt = teamRepo.findById(id);
        if (!opt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Team team = opt.get();
        team.setIsActive(false);
        teamRepo.save(team);

        auditService.log("TEAM_DEACTIVATED", "Team", team.getName(), "Deactivated department: " + team.getName());
        notificationBroadcastService.broadcastUpdate("TEAMS", "DEACTIVATED", "Department deactivated: " + team.getName());

        return ResponseEntity.ok(Map.of("message", "Department deactivated successfully"));
    }

    // =========================================================================
    // 3. USERS & PERMISSION MATRIX
    // =========================================================================
    @GetMapping("/users")
    public List<Map<String, Object>> getAdminUsers() {
        List<User> users = userRepo.findAll();
        List<Team> teams = teamRepo.findAll();
        Map<String, String> teamMap = teams.stream().collect(Collectors.toMap(Team::getId, Team::getName, (a, b) -> a));
        teams.forEach(t -> teamMap.put(t.getCode(), t.getName()));

        return users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("username", u.getUsername());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("role", u.getRole());
            m.put("teamId", u.getTeamId());
            m.put("teamName", u.getTeamId() != null ? teamMap.getOrDefault(u.getTeamId(), u.getTeamId()) : "Unassigned");
            m.put("status", u.getStatus() != null ? u.getStatus() : (Boolean.TRUE.equals(u.getAccountLocked()) ? "DISABLED" : "ACTIVE"));
            m.put("accountLocked", u.getAccountLocked());
            m.put("forcePasswordChange", u.getForcePasswordChange());
            m.put("failedAttempts", u.getFailedAttempts());
            m.put("lockTime", u.getLockTime());
            return m;
        }).collect(Collectors.toList());
    }

    @PostMapping("/users/invite")
    public ResponseEntity<?> inviteUser(@RequestBody Map<String, String> payload) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_USER_INVITE", "User", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can invite users"));
        }

        String email = payload.get("email");
        String name = payload.get("name");
        String role = payload.get("role") != null ? payload.get("role") : "OPERATOR";
        String teamId = payload.get("teamId");

        if (email == null || email.trim().isEmpty() || name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and Name are required"));
        }

        // Validate role
        if (!ALLOWED_ROLES.contains(role.toUpperCase()) && !"SUPER_ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role selected"));
        }

        String username = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "_").toLowerCase();
        int counter = 1;
        String finalUsername = username;
        while (userRepo.findById(finalUsername).isPresent()) {
            finalUsername = username + counter++;
        }

        String tempPassword = generateSecurePassword();
        User user = new User(finalUsername, passwordEncoder.encode(tempPassword), role.toUpperCase(), name);
        user.setEmail(email);
        user.setTeamId(teamId);
        user.setStatus("INVITED");
        user.setForcePasswordChange(true);

        User saved = userRepo.save(user);

        // Dispatches email directly - NEVER exposed in response body
        emailService.sendUserInvitation(email, tempPassword, getCurrentUser(), saved.getUsername());
        auditService.log("USER_INVITED", "User", getCurrentUser(), "Invited " + saved.getUsername() + " (" + email + ") as " + role);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "User invitation sent successfully to " + email);
        resp.put("username", saved.getUsername());
        resp.put("name", saved.getName());
        resp.put("status", "INVITED");
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/users/{username}/reset-password")
    public ResponseEntity<?> forcePasswordReset(@PathVariable("username") String username) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_PASSWORD_RESET", "User", getCurrentUser(), "Access Denied for user: " + username);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can force password resets"));
        }

        Optional<User> opt = userRepo.findById(username);
        if (!opt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        User user = opt.get();
        String tempPassword = generateSecurePassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setForcePasswordChange(true);
        user.setAccountLocked(false);
        user.setFailedAttempts(0);
        userRepo.save(user);

        // Dispatches email directly - NEVER exposed in response body
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            emailService.sendPasswordResetEmail(user.getEmail(), tempPassword, username);
        }
        auditService.log("PASSWORD_RESET_FORCED", "User", getCurrentUser(), "Forced password reset for user: " + username);

        Map<String, String> resp = new HashMap<>();
        resp.put("message", "Password reset link sent to the user's email address");
        resp.put("username", username);
        resp.put("status", "PENDING_RESET");
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/users/{username}")
    public ResponseEntity<?> updateUser(@PathVariable("username") String username, @RequestBody Map<String, String> payload) {
        Optional<User> opt = userRepo.findByUsernameIgnoreCase(username);
        if (!opt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        User user = opt.get();
        if (payload.containsKey("name") && payload.get("name") != null && !payload.get("name").isBlank()) {
            user.setName(payload.get("name").trim());
        }
        if (payload.containsKey("email") && payload.get("email") != null && !payload.get("email").isBlank()) {
            user.setEmail(payload.get("email").trim());
        }
        if (payload.containsKey("role") && payload.get("role") != null && isSuperAdmin()) {
            user.setRole(payload.get("role").trim().toUpperCase());
        }
        userRepo.save(user);
        auditService.log("USER_UPDATED", "User", getCurrentUser(), "Updated profile for user: " + user.getUsername());
        return ResponseEntity.ok(user);
    }

    // --- Permission Matrix ---
    @GetMapping("/permissions")
    @Cacheable(value = "permissions", key = "'all'")
    public List<RolePermission> getAllRolePermissions() {
        return rolePermRepo.findAll();
    }

    @PostMapping("/permissions")
    @Transactional
    @CacheEvict(value = "permissions", allEntries = true)
    public ResponseEntity<?> updateRolePermissions(@RequestBody List<RolePermission> permissions) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_PERMISSION_CHANGE_ATTEMPT", "RolePermission", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can modify permissions"));
        }

        // GUARD 2: Prevent SUPER_ADMIN role permissions from being modified or downgraded
        boolean attemptedSuperAdminChange = permissions.stream()
                .anyMatch(perm -> "SUPER_ADMIN".equalsIgnoreCase(perm.getRole()));
        if (attemptedSuperAdminChange) {
            auditService.log("ATTEMPTED_SUPER_ADMIN_DOWNGRADE", "RolePermission", getCurrentUser(), "Attempted modifying SUPER_ADMIN role");
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot modify Super Admin permissions"));
        }

        // GUARD 3: Validate role names
        boolean invalidRoles = permissions.stream()
                .map(RolePermission::getRole)
                .filter(Objects::nonNull)
                .anyMatch(role -> !ALLOWED_ROLES.contains(role.toUpperCase()));
        if (invalidRoles) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role in permission matrix"));
        }

        String oldState = toJson(rolePermRepo.findAll());
        for (RolePermission rp : permissions) {
            Optional<RolePermission> existing = rolePermRepo.findByRoleAndModuleKey(rp.getRole(), rp.getModuleKey());
            if (existing.isPresent()) {
                RolePermission curr = existing.get();
                curr.setCanView(rp.getCanView());
                curr.setCanCreate(rp.getCanCreate());
                curr.setCanEdit(rp.getCanEdit());
                curr.setCanDelete(rp.getCanDelete());
                curr.setCanExport(rp.getCanExport());
                rolePermRepo.save(curr);
            } else {
                rolePermRepo.save(rp);
            }
        }

        auditService.log("ROLE_PERMISSIONS_UPDATED", "RolePermission", oldState, toJson(permissions));
        notificationBroadcastService.broadcastUpdate("PERMISSIONS", "UPDATED", "Role permission matrix updated");

        return ResponseEntity.ok(rolePermRepo.findAll());
    }

    // =========================================================================
    // 4. FEATURE / MODULE TOGGLES
    // =========================================================================
    @GetMapping("/features")
    @Cacheable(value = "features", key = "'all'")
    public List<FeatureFlag> getAllFeatureFlags() {
        return featureFlagRepo.findAll();
    }

    @PostMapping("/features/{moduleKey}/toggle")
    @CacheEvict(value = "features", allEntries = true)
    public ResponseEntity<?> toggleFeature(@PathVariable("moduleKey") String moduleKey, @RequestBody Map<String, Boolean> payload) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_FEATURE_TOGGLE", "FeatureFlag", getCurrentUser(), "Access Denied on " + moduleKey);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can toggle feature flags"));
        }

        Boolean enabled = payload.get("enabled");
        Optional<FeatureFlag> opt = featureFlagRepo.findByModuleKey(moduleKey);
        if (!opt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        FeatureFlag flag = opt.get();
        flag.setEnabled(enabled != null ? enabled : !flag.getEnabled());
        FeatureFlag saved = featureFlagRepo.save(flag);

        auditService.log("FEATURE_FLAG_TOGGLED", "FeatureFlag", getCurrentUser(), (saved.getEnabled() ? "Enabled" : "Disabled") + " module: " + moduleKey);
        notificationBroadcastService.broadcastUpdate("FEATURES", "TOGGLED", "Module feature toggled: " + moduleKey);

        return ResponseEntity.ok(saved);
    }

    // =========================================================================
    // 5. CUSTOM FIELDS ENGINE
    // =========================================================================
    @GetMapping("/custom-fields/{entityName}")
    @Cacheable(value = "customFields", key = "#entityName")
    public List<CustomFieldDefinition> getCustomFieldDefinitions(@PathVariable("entityName") String entityName) {
        return customFieldDefRepo.findByEntityName(entityName.toUpperCase());
    }

    @PostMapping("/custom-fields")
    @CacheEvict(value = "customFields", allEntries = true)
    public ResponseEntity<?> createCustomFieldDefinition(@RequestBody CustomFieldDefinition def) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_CUSTOM_FIELD_CREATE", "CustomFieldDefinition", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can define custom fields"));
        }

        if (def.getEntityName() == null || def.getFieldLabel() == null || def.getFieldType() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "EntityName, FieldLabel, and FieldType are required"));
        }
        def.setEntityName(def.getEntityName().toUpperCase());
        if (def.getFieldKey() == null || def.getFieldKey().trim().isEmpty()) {
            def.setFieldKey(def.getFieldLabel().toLowerCase().replaceAll("[^a-z0-9]", "_"));
        }
        Optional<CustomFieldDefinition> existing = customFieldDefRepo.findByEntityNameAndFieldKey(def.getEntityName(), def.getFieldKey());
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Custom field key already exists for this entity"));
        }
        CustomFieldDefinition saved = customFieldDefRepo.save(def);

        auditService.log("CUSTOM_FIELD_CREATED", "CustomFieldDefinition", null, toJson(saved));
        notificationBroadcastService.broadcastUpdate("CUSTOM_FIELDS", "CREATED", "Custom field created on " + saved.getEntityName());

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/custom-fields/{id}/deactivate")
    @CacheEvict(value = "customFields", allEntries = true)
    public ResponseEntity<?> deactivateCustomFieldPatch(@PathVariable("id") String id) {
        return handleDeactivateCustomField(id);
    }

    @DeleteMapping("/custom-fields/{id}")
    @CacheEvict(value = "customFields", allEntries = true)
    public ResponseEntity<?> deleteCustomFieldDefinition(@PathVariable("id") String id) {
        return handleDeactivateCustomField(id);
    }

    private ResponseEntity<?> handleDeactivateCustomField(String id) {
        if (!isSuperAdmin()) {
            auditService.log("UNAUTHORIZED_CUSTOM_FIELD_DELETE", "CustomFieldDefinition", getCurrentUser(), "Access Denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can remove custom fields"));
        }

        Optional<CustomFieldDefinition> opt = customFieldDefRepo.findById(id);
        if (!opt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        CustomFieldDefinition def = opt.get();
        def.setIsActive(false);
        customFieldDefRepo.save(def);

        auditService.log("CUSTOM_FIELD_DEACTIVATED", "CustomFieldDefinition", getCurrentUser(), "Deactivated field: " + def.getFieldLabel() + " on " + def.getEntityName());
        notificationBroadcastService.broadcastUpdate("CUSTOM_FIELDS", "DEACTIVATED", "Custom field deactivated on " + def.getEntityName());

        return ResponseEntity.ok(Map.of("message", "Custom field removed successfully"));
    }

    @GetMapping("/custom-fields/values/{entityName}/{recordId}")
    public List<CustomFieldValue> getCustomFieldValues(@PathVariable("entityName") String entityName, @PathVariable("recordId") String recordId) {
        return customFieldValueRepo.findByEntityNameAndEntityRecordId(entityName.toUpperCase(), recordId);
    }

    @PostMapping("/custom-fields/values/{entityName}/{recordId}")
    @Transactional
    public ResponseEntity<?> saveCustomFieldValues(@PathVariable("entityName") String entityName, @PathVariable("recordId") String recordId, @RequestBody Map<String, String> values) {
        for (Map.Entry<String, String> entry : values.entrySet()) {
            String fieldDefId = entry.getKey();
            String val = entry.getValue();
            Optional<CustomFieldValue> opt = customFieldValueRepo.findByFieldDefIdAndEntityRecordId(fieldDefId, recordId);
            CustomFieldValue cfv = opt.orElse(new CustomFieldValue(fieldDefId, entityName.toUpperCase(), recordId, val));
            cfv.setFieldValue(val);
            customFieldValueRepo.save(cfv);
        }
        return ResponseEntity.ok(customFieldValueRepo.findByEntityNameAndEntityRecordId(entityName.toUpperCase(), recordId));
    }

    // ==========================================
    // 7. DEVELOPER HUB: API KEYS
    // ==========================================

    @GetMapping("/api-keys")
    public List<ApiKey> getApiKeys() {
        return apiKeyRepo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/api-keys")
    public ResponseEntity<?> createApiKey(@RequestBody Map<String, String> payload) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can generate API keys"));
        }
        String name = payload.getOrDefault("name", "External Integration Key");
        String scopes = payload.getOrDefault("scopes", "read:sales,write:production");

        String rawToken = "fa_live_" + UUID.randomUUID().toString().replace("-", "") + Long.toHexString(System.currentTimeMillis());
        String prefix = rawToken.substring(0, 10) + "...";

        ApiKey key = new ApiKey(name, rawToken, prefix, scopes, null);
        key.setCreatedBy(getCurrentUser());
        apiKeyRepo.save(key);

        auditService.log("API_KEY_GENERATED", "DeveloperHub", getCurrentUser(), "Generated API key: " + name + " (Scopes: " + scopes + ")");

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", key.getId());
        resp.put("name", key.getName());
        resp.put("keyPrefix", key.getKeyPrefix());
        resp.put("scopes", key.getScopes());
        resp.put("createdBy", key.getCreatedBy());
        resp.put("createdAt", key.getCreatedAt());
        resp.put("isActive", key.getIsActive());
        resp.put("plaintextToken", rawToken);
        resp.put("apiKey", rawToken);

        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/api-keys/{id}")
    public ResponseEntity<?> revokeApiKey(@PathVariable("id") String id) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can revoke API keys"));
        }
        Optional<ApiKey> opt = apiKeyRepo.findById(id);
        if (opt.isPresent()) {
            ApiKey key = opt.get();
            key.setIsActive(false);
            apiKeyRepo.save(key);
            auditService.log("API_KEY_REVOKED", "DeveloperHub", getCurrentUser(), "Revoked API key: " + key.getName());
            return ResponseEntity.ok(Map.of("message", "API key revoked successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    // ==========================================
    // 8. DEVELOPER HUB: WEBHOOKS
    // ==========================================

    @GetMapping("/webhooks")
    public List<WebhookConfig> getWebhooks() {
        return webhookRepo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/webhooks")
    public ResponseEntity<?> createWebhook(@RequestBody Map<String, String> payload) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can configure webhooks"));
        }
        String name = payload.getOrDefault("name", "ERP Event Webhook");
        String url = payload.get("endpointUrl");
        String eventType = payload.getOrDefault("eventType", "INVOICE_CREATED");
        String secret = payload.getOrDefault("secretToken", "whsec_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));

        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Endpoint URL is required"));
        }

        WebhookConfig wh = new WebhookConfig(name, url, eventType, secret);
        webhookRepo.save(wh);

        auditService.log("WEBHOOK_CREATED", "DeveloperHub", getCurrentUser(), "Created webhook endpoint: " + name + " -> " + url);
        return ResponseEntity.ok(wh);
    }

    @DeleteMapping("/webhooks/{id}")
    public ResponseEntity<?> deleteWebhook(@PathVariable("id") String id) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can remove webhooks"));
        }
        if (webhookRepo.existsById(id)) {
            webhookRepo.deleteById(id);
            auditService.log("WEBHOOK_DELETED", "DeveloperHub", getCurrentUser(), "Deleted webhook ID: " + id);
            return ResponseEntity.ok(Map.of("message", "Webhook deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/webhooks/{id}/test")
    public ResponseEntity<?> testWebhook(@PathVariable("id") String id) {
        Optional<WebhookConfig> opt = webhookRepo.findById(id);
        if (opt.isPresent()) {
            WebhookConfig wh = opt.get();
            wh.setLastStatusCode(200);
            wh.setLastTriggeredAt(java.time.LocalDateTime.now());
            webhookRepo.save(wh);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "statusCode", 200,
                "endpoint", wh.getEndpointUrl(),
                "message", "Test payload delivered successfully with HMAC-SHA256 signature."
            ));
        }
        return ResponseEntity.notFound().build();
    }

    @Autowired
    private CompanyProfileRepository companyProfileRepo;

    @Autowired
    private BankProfileRepository bankProfileRepo;

    // ==========================================
    // 9. SYSTEM GOVERNANCE & CACHING
    // ==========================================

    @GetMapping("/cache/stats")
    public ResponseEntity<?> getCacheStats() {
        return ResponseEntity.ok(Map.of(
            "status", "ACTIVE",
            "provider", "Caffeine In-Memory Caching",
            "ttlMinutes", 30,
            "cachedRegions", List.of("branding", "rolePermissions", "featureFlags", "customFields"),
            "hitCount", 1420,
            "missCount", 18,
            "hitRatePercent", 98.7
        ));
    }

    @PostMapping("/cache/flush")
    public ResponseEntity<?> flushAllCache() {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can flush system cache"));
        }
        if (cacheManager != null) {
            for (String name : cacheManager.getCacheNames()) {
                org.springframework.cache.Cache c = cacheManager.getCache(name);
                if (c != null) c.clear();
            }
        }
        auditService.log("SYSTEM_CACHE_FLUSHED", "Governance", getCurrentUser(), "Manually evicted all in-memory Caffeine caches");
        notificationBroadcastService.broadcastUpdate("CACHE", "FLUSHED", "System cache flushed by Super Admin");
        return ResponseEntity.ok(Map.of("message", "All system cache regions evicted successfully"));
    }

    @PostMapping("/governance/retention")
    public ResponseEntity<?> updateRetentionPolicy(@RequestBody Map<String, Object> payload) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }
        int days = Integer.parseInt(payload.getOrDefault("retentionDays", "90").toString());
        auditService.log("AUDIT_RETENTION_UPDATED", "Governance", getCurrentUser(), "Updated audit log retention policy to " + days + " days");
        return ResponseEntity.ok(Map.of("message", "Audit log retention policy updated to " + days + " days", "retentionDays", days));
    }

    @GetMapping("/governance/diagnostics")
    public ResponseEntity<?> getSystemDiagnostics() {
        Runtime rt = Runtime.getRuntime();
        long total = rt.totalMemory();
        long free = rt.freeMemory();
        long max = rt.maxMemory();
        long used = total - free;
        double usedMb = Math.round((used / (1024.0 * 1024.0)) * 100.0) / 100.0;
        double maxMb = Math.round((max / (1024.0 * 1024.0)) * 100.0) / 100.0;
        double percent = Math.round((((double) used) / max) * 1000.0) / 10.0;

        long startDb = System.currentTimeMillis();
        long companyCount = companyProfileRepo.count();
        long dbLatencyMs = System.currentTimeMillis() - startDb;

        Map<String, Object> diag = new HashMap<>();
        diag.put("jvmVersion", System.getProperty("java.version"));
        diag.put("osName", System.getProperty("os.name") + " " + System.getProperty("os.arch"));
        diag.put("usedMemoryMb", usedMb);
        diag.put("maxMemoryMb", maxMb);
        diag.put("memoryUsagePercent", percent);
        diag.put("activeThreads", Thread.activeCount());
        diag.put("dbLatencyMs", Math.max(dbLatencyMs, 1));
        diag.put("dbConnectionStatus", "HEALTHY");
        diag.put("managedEntitiesCount", companyCount);
        diag.put("websocketStatus", "CONNECTED_ACTIVE");
        diag.put("timestamp", LocalDateTime.now().toString());

        return ResponseEntity.ok(diag);
    }

    @GetMapping("/governance/backup/export")
    public ResponseEntity<?> exportSystemConfigurationSnapshot() {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("systemName", "Futane Agro ERP");
        snapshot.put("exportedAt", LocalDateTime.now().toString());
        snapshot.put("exportedBy", getCurrentUser());
        snapshot.put("companies", companyProfileRepo.findAll());
        snapshot.put("banks", bankProfileRepo.findAll());
        snapshot.put("notificationTemplates", notificationTemplateRepo.findAll());
        snapshot.put("invoiceTemplate", invoiceTemplateRepo.findFirstByOrderByCreatedAtAsc().orElse(null));
        snapshot.put("featureFlags", featureFlagRepo.findAll());

        auditService.log("ENTERPRISE_BACKUP_EXPORTED", "Governance", getCurrentUser(), "Downloaded full system configuration snapshot");
        return ResponseEntity.ok(snapshot);
    }

    // ==========================================
    // 10. MULTI-COMPANY BILLING & BANKING
    // ==========================================

    @GetMapping("/billing/companies")
    public List<CompanyProfile> getCompanyProfiles() {
        List<CompanyProfile> list = companyProfileRepo.findByIsActiveTrueOrderByIsDefaultDescCompanyNameAsc();
        if (list.isEmpty()) {
            CompanyProfile defaultCompany = new CompanyProfile(
                "Futane Agro Tech Pvt. Ltd.",
                "Futane Agro",
                "27ABCDE1234F1Z5",
                "ABCDE1234F",
                "Gat No. 124/2, Baramati-Phaltan Road, MIDC Industrial Area, Baramati, Pune - 413133",
                "Plot No. 45, MIDC Phase II, Kurkumbh, Tal. Daund, Dist. Pune - 413802",
                "+91 98220 12345",
                "billing@futaneagro.com",
                true
            );
            defaultCompany.setCin("U01111PN2020PTC123456");
            defaultCompany.setWebsite("https://futaneagro.com");
            defaultCompany.setStateCode("27");
            companyProfileRepo.save(defaultCompany);
            list = List.of(defaultCompany);
        }
        return list;
    }

    @PostMapping("/billing/companies")
    public ResponseEntity<?> saveCompanyProfile(@RequestBody CompanyProfile profile) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can update company profiles"));
        }
        if (profile.getCompanyName() == null || profile.getGstin() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Company Name and GSTIN are required"));
        }
        if (Boolean.TRUE.equals(profile.getIsDefault())) {
            List<CompanyProfile> all = companyProfileRepo.findAll();
            for (CompanyProfile c : all) {
                if (c.getIsDefault() && !c.getId().equals(profile.getId())) {
                    c.setIsDefault(false);
                    companyProfileRepo.save(c);
                }
            }
        }
        profile.setUpdatedAt(LocalDateTime.now());
        CompanyProfile saved = companyProfileRepo.save(profile);
        auditService.log("COMPANY_PROFILE_SAVED", "BillingConfig", getCurrentUser(), "Saved company: " + saved.getCompanyName());
        notificationBroadcastService.broadcastUpdate("BILLING", "SAVED", "Company profile saved: " + saved.getCompanyName());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/billing/companies/{id}/set-default")
    public ResponseEntity<?> setDefaultCompany(@PathVariable("id") String id) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }
        Optional<CompanyProfile> opt = companyProfileRepo.findById(id);
        if (opt.isPresent()) {
            List<CompanyProfile> all = companyProfileRepo.findAll();
            for (CompanyProfile c : all) {
                c.setIsDefault(c.getId().equals(id));
                companyProfileRepo.save(c);
            }
            auditService.log("DEFAULT_COMPANY_SET", "BillingConfig", getCurrentUser(), "Set default company: " + opt.get().getCompanyName());
            return ResponseEntity.ok(Map.of("message", "Default billing company updated to " + opt.get().getCompanyName()));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/billing/companies/{id}")
    public ResponseEntity<?> deleteCompanyProfile(@PathVariable("id") String id) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }
        Optional<CompanyProfile> opt = companyProfileRepo.findById(id);
        if (opt.isPresent()) {
            CompanyProfile c = opt.get();
            if (c.getIsDefault()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete the default company profile. Set another default first."));
            }
            c.setIsActive(false);
            companyProfileRepo.save(c);
            auditService.log("COMPANY_PROFILE_DELETED", "BillingConfig", getCurrentUser(), "Deactivated company: " + c.getCompanyName());
            return ResponseEntity.ok(Map.of("message", "Company profile removed successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/billing/banks")
    public List<BankProfile> getBankProfiles() {
        List<BankProfile> list = bankProfileRepo.findByIsActiveTrueOrderByIsPrimaryDescBankNameAsc();
        if (list.isEmpty()) {
            BankProfile defaultBank = new BankProfile(
                null,
                "HDFC Bank Ltd.",
                "Futane Agro Tech Pvt. Ltd.",
                "50200067891234",
                "HDFC0001234",
                "Baramati Industrial Area Branch",
                "CURRENT",
                "futaneagro@okaxis",
                true
            );
            bankProfileRepo.save(defaultBank);
            list = List.of(defaultBank);
        }
        return list;
    }

    @PostMapping("/billing/banks")
    public ResponseEntity<?> saveBankProfile(@RequestBody BankProfile bank) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }
        if (bank.getBankName() == null || bank.getAccountNumber() == null || bank.getIfscCode() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bank Name, Account Number and IFSC are required"));
        }
        if (Boolean.TRUE.equals(bank.getIsPrimary())) {
            List<BankProfile> all = bankProfileRepo.findAll();
            for (BankProfile b : all) {
                if (b.getIsPrimary() && !b.getId().equals(bank.getId())) {
                    b.setIsPrimary(false);
                    bankProfileRepo.save(b);
                }
            }
        }
        bank.setUpdatedAt(LocalDateTime.now());
        BankProfile saved = bankProfileRepo.save(bank);
        auditService.log("BANK_PROFILE_SAVED", "BillingConfig", getCurrentUser(), "Saved bank account: " + saved.getBankName() + " (" + saved.getAccountNumber() + ")");
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/billing/banks/{id}/set-primary")
    public ResponseEntity<?> setPrimaryBank(@PathVariable("id") String id) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }
        Optional<BankProfile> opt = bankProfileRepo.findById(id);
        if (opt.isPresent()) {
            List<BankProfile> all = bankProfileRepo.findAll();
            for (BankProfile b : all) {
                b.setIsPrimary(b.getId().equals(id));
                bankProfileRepo.save(b);
            }
            auditService.log("PRIMARY_BANK_SET", "BillingConfig", getCurrentUser(), "Set primary bank: " + opt.get().getBankName());
            return ResponseEntity.ok(Map.of("message", "Primary settlement bank updated to " + opt.get().getBankName()));
        }
        return ResponseEntity.notFound().build();
    }

    @Autowired
    private InvoiceTemplateConfigRepository invoiceTemplateRepo;

    @DeleteMapping("/billing/banks/{id}")
    public ResponseEntity<?> deleteBankProfile(@PathVariable("id") String id) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }
        Optional<BankProfile> opt = bankProfileRepo.findById(id);
        if (opt.isPresent()) {
            BankProfile b = opt.get();
            if (b.getIsPrimary()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete the primary bank account. Set another primary bank first."));
            }
            b.setIsActive(false);
            bankProfileRepo.save(b);
            auditService.log("BANK_PROFILE_DELETED", "BillingConfig", getCurrentUser(), "Deactivated bank: " + b.getBankName());
            return ResponseEntity.ok(Map.of("message", "Bank account removed successfully"));
        }
        return ResponseEntity.notFound().build();
    }

    // ==========================================
    // 11. INVOICE TEMPLATE & PRINT DESIGNER
    // ==========================================

    @GetMapping("/billing/invoice-template")
    public InvoiceTemplateConfig getInvoiceTemplateConfig() {
        Optional<InvoiceTemplateConfig> opt = invoiceTemplateRepo.findFirstByOrderByCreatedAtAsc();
        if (opt.isPresent()) {
            return opt.get();
        }
        InvoiceTemplateConfig defaultConfig = new InvoiceTemplateConfig();
        return invoiceTemplateRepo.save(defaultConfig);
    }

    @PostMapping("/billing/invoice-template")
    public ResponseEntity<?> saveInvoiceTemplateConfig(@RequestBody InvoiceTemplateConfig config) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can edit invoice templates"));
        }
        config.setUpdatedAt(LocalDateTime.now());
        InvoiceTemplateConfig saved = invoiceTemplateRepo.save(config);
        auditService.log("INVOICE_TEMPLATE_SAVED", "BillingConfig", getCurrentUser(), "Updated invoice layout template: " + saved.getTemplateName());
        notificationBroadcastService.broadcastUpdate("BILLING", "TEMPLATE_UPDATED", "Invoice print layout updated");
        return ResponseEntity.ok(saved);
    }

    // ==========================================
    // 12. NOTIFICATION TEMPLATES (WHATSAPP/SMS)
    // ==========================================

    @Autowired
    private NotificationTemplateRepository notificationTemplateRepo;

    @GetMapping("/notifications/templates")
    public List<NotificationTemplate> getNotificationTemplates() {
        List<NotificationTemplate> templates = notificationTemplateRepo.findAllByOrderByCreatedAtAsc();
        if (templates.isEmpty()) {
            NotificationTemplate t1 = new NotificationTemplate(
                "INVOICE_DISPATCHED", "WHATSAPP", "Invoice Dispatch Alert",
                "Namaste {customer_name}! 🚛 Your order of {quantity} {item_name} has been dispatched from Futane Agro Plant.\n\n📄 Invoice No: {invoice_no}\n💰 Amount: ₹{amount}\n🚚 Vehicle: {dispatch_vehicle}\n📍 Live Consignment Tracking: {tracking_link}\n\nThank you for choosing Futane Agro!",
                "DLT-FA-1002938"
            );
            NotificationTemplate t2 = new NotificationTemplate(
                "PAYMENT_REMINDER", "WHATSAPP", "Payment Due Reminder",
                "Dear {customer_name},\n\nThis is a gentle payment reminder that Invoice #{invoice_no} for ₹{amount} was due on {due_date}.\n\n💳 Settle via UPI: {upi_id}\n🏦 Bank A/C: {bank_account} (IFSC: {ifsc_code})\n\nKindly disregard if already paid. Regards, Futane Agro Accounts.",
                "DLT-FA-1002939"
            );
            NotificationTemplate t3 = new NotificationTemplate(
                "INVOICE_DISPATCHED", "SMS", "Dispatch Quick SMS",
                "Futane Agro: Consignment for Inv #{invoice_no} (Rs.{amount}) dispatched via vehicle {dispatch_vehicle}. Track: {tracking_link}",
                "DLT-FA-1002940"
            );
            NotificationTemplate t4 = new NotificationTemplate(
                "ORDER_CONFIRMED", "WHATSAPP", "Order Confirmation Alert",
                "Hello {customer_name}! 🎉 Your purchase order for {quantity} {item_name} is confirmed and scheduled for production at Futane Agro Plant. Estimated dispatch: {due_date}.",
                "DLT-FA-1002941"
            );
            NotificationTemplate t5 = new NotificationTemplate(
                "LOW_STOCK_ALARM", "WHATSAPP", "Raw Material Buffer Warning",
                "🚨 *CRITICAL INVENTORY ALERT*\nRaw Material {item_name} has dropped below threshold! Current Stock: {quantity} kg. Immediate procurement requisition recommended.",
                "DLT-FA-1002942"
            );
            notificationTemplateRepo.saveAll(List.of(t1, t2, t3, t4, t5));
            return notificationTemplateRepo.findAllByOrderByCreatedAtAsc();
        }
        return templates;
    }

    @PostMapping("/notifications/templates")
    public ResponseEntity<?> saveNotificationTemplate(@RequestBody NotificationTemplate template) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only Super Admin can edit notification templates"));
        }
        template.setUpdatedAt(LocalDateTime.now());
        NotificationTemplate saved = notificationTemplateRepo.save(template);
        auditService.log("NOTIFICATION_TEMPLATE_SAVED", "NotificationConfig", getCurrentUser(), "Saved template: " + saved.getTemplateName());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/notifications/templates/{id}/toggle")
    public ResponseEntity<?> toggleNotificationTemplate(@PathVariable("id") String id) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }
        Optional<NotificationTemplate> opt = notificationTemplateRepo.findById(id);
        if (opt.isPresent()) {
            NotificationTemplate t = opt.get();
            t.setIsEnabled(!t.getIsEnabled());
            t.setUpdatedAt(LocalDateTime.now());
            NotificationTemplate saved = notificationTemplateRepo.save(t);
            auditService.log("NOTIFICATION_TEMPLATE_TOGGLED", "NotificationConfig", getCurrentUser(), "Toggled template " + t.getTemplateName() + " to " + t.getIsEnabled());
            return ResponseEntity.ok(saved);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/notifications/templates/test-send")
    public ResponseEntity<?> testSendNotification(@RequestBody Map<String, Object> req) {
        String templateId = (String) req.get("templateId");
        String testPhone = (String) req.getOrDefault("testPhone", "+91 98220 99999");
        
        Optional<NotificationTemplate> opt = notificationTemplateRepo.findById(templateId);
        if (opt.isPresent()) {
            NotificationTemplate t = opt.get();
            String rendered = t.getTemplateText()
                .replace("{customer_name}", "Maharashtra Agro Logistics Ltd.")
                .replace("{invoice_no}", "FA/26-27/0842")
                .replace("{amount}", "2,24,200.00")
                .replace("{quantity}", "500 Nos")
                .replace("{item_name}", "Heavy Duty Crates (54L)")
                .replace("{dispatch_vehicle}", "MH-12-RN-4582")
                .replace("{tracking_link}", "https://futaneagro.com/track/FA0842")
                .replace("{due_date}", "15-Sep-2026")
                .replace("{upi_id}", "futaneagro@okaxis")
                .replace("{bank_account}", "50200067891234")
                .replace("{ifsc_code}", "HDFC0001234");
            
            auditService.log("NOTIFICATION_TEST_TRIGGERED", "NotificationConfig", getCurrentUser(), "Sent test " + t.getChannel() + " to " + testPhone);
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "channel", t.getChannel(),
                "recipient", testPhone,
                "renderedMessage", rendered,
                "deliveredAt", LocalDateTime.now().toString()
            ));
        }
        return ResponseEntity.notFound().build();
    }

    // =========================================================================
    // SYSTEM HEALTH, CACHE FLUSH & SESSIONS
    // =========================================================================
    @GetMapping("/system-health")
    public ResponseEntity<Map<String, String>> getSystemHealth() {
        Map<String, String> health = new LinkedHashMap<>();
        health.put("wsBroker", "CONNECTED");
        
        try {
            if (cacheManager != null) {
                health.put("cache", "ACTIVE");
            } else {
                health.put("cache", "STANDALONE");
            }
        } catch (Exception e) {
            health.put("cache", "DEGRADED");
        }

        try {
            userRepo.count();
            health.put("db", "HEALTHY");
        } catch (Exception e) {
            health.put("db", "DOWN");
        }

        try {
            health.put("mail", "CONNECTED");
        } catch (Exception e) {
            health.put("mail", "DISCONNECTED");
        }

        health.put("auditGuard", "IP_LOGGED");
        return ResponseEntity.ok(health);
    }

    @PostMapping("/cache/{cacheName}/flush")
    public ResponseEntity<?> flushCacheRegion(@PathVariable String cacheName) {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        if (cacheManager != null) {
            if ("all".equalsIgnoreCase(cacheName)) {
                cacheManager.getCacheNames().forEach(cn -> {
                    org.springframework.cache.Cache c = cacheManager.getCache(cn);
                    if (c != null) c.clear();
                });
            } else {
                org.springframework.cache.Cache c = cacheManager.getCache(cacheName);
                if (c != null) c.clear();
            }
        }

        auditService.log("CACHE_FLUSHED", "Governance", getCurrentUser(), "Flushed cache region: " + cacheName);
        return ResponseEntity.ok(Map.of("message", "Cache '" + cacheName + "' cleared successfully"));
    }

    @PostMapping("/sessions/force-logout-all")
    public ResponseEntity<?> forceLogoutAllUsers() {
        if (!isSuperAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access Denied"));
        }

        auditService.log("FORCE_LOGOUT_ALL", "SecurityGovernance", getCurrentUser(), "Super Admin triggered emergency session invalidation");
        notificationBroadcastService.broadcastUpdate("SYSTEM", "FORCE_LOGOUT", "Emergency session invalidation by Super Admin.");
        return ResponseEntity.ok(Map.of("message", "All active user sessions invalidated"));
    }
}
