package com.futaneagro.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * JSON Web Token (JWT) Cryptographic Utilities.
 * <p>
 * Manages the issuance, parsing, validation, and claims extraction for stateless authentication tokens:
 * <ul>
 *   <li><b>Standard Business Tokens:</b> Signed with HMAC-SHA256 ({@link SignatureAlgorithm#HS256}) using
 *       {@code jwt.secret}, embedding user roles, username subject, and a unique UUID token ID ({@code jti}) for auditing.</li>
 *   <li><b>Pre-Authentication MFA Tokens:</b> Short-lived (5-minute TTL) tokens containing {@code scope: "PRE_MFA"}
 *       and target MFA factor, but strictly omitting business authorization roles so unauthorized access is barred.</li>
 *   <li><b>Token Expiry Telemetry:</b> Extracts precise epoch millisecond expiration times to set accurate TTLs
 *       in {@link TokenBlacklistService} during user logouts.</li>
 * </ul>
 *
 * @author Futane Agro Core Architecture Team
 */
@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    /**
     * Extracts the primary username subject from a signed JWT string.
     *
     * @param token the serialized JWT string
     * @return the username subject claim
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setId(UUID.randomUUID().toString()) // jti — unique token ID for tracking
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    /**
     * Returns the token's expiry as epoch milliseconds.
     * Used by TokenBlacklistService to set precise TTL on blacklist entries.
     */
    public long getTokenExpiryMs(String token) {
        try {
            return extractExpiration(token).getTime();
        } catch (Exception e) {
            log.warn("Could not extract expiry from token: {}", e.getMessage());
            return System.currentTimeMillis() + 86_400_000L; // fallback: 24h
        }
    }

    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    /**
     * Generates a temporary Pre-Authentication JWT used strictly between Step 1 (password)
     * and Step 2 (MFA verification). Has short 5-minute TTL, contains scope: "PRE_MFA" and NO business roles.
     */
    public String generatePreAuthToken(String userId, String username, String factor) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("scope", "PRE_MFA");
        claims.put("factor", factor);
        long preAuthExpirationMs = 300_000L; // 5 minutes
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + preAuthExpirationMs))
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    public boolean isPreAuthToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return "PRE_MFA".equals(claims.get("scope", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean validatePreAuthToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return "PRE_MFA".equals(claims.get("scope", String.class)) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public String extractUserId(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("userId", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public String extractFactor(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.get("factor", String.class);
        } catch (Exception e) {
            return null;
        }
    }
}
