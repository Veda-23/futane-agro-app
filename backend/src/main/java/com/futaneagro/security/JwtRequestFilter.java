package com.futaneagro.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

/**
 * Once-Per-Request Inbound JWT Authentication Filter.
 * <p>
 * Intercepts every inbound HTTP request to authenticate caller identity and establish Spring Security context:
 * <ul>
 *   <li><b>Authorization Header Parsing:</b> Extracts the {@code Bearer <token>} string from the {@code Authorization} header.</li>
 *   <li><b>Server-Side Revocation Barrier:</b> Verifies token against {@link TokenBlacklistService}. If the user logged out,
 *       immediately rejects request with HTTP 401 Unauthorized before touching controllers or databases.</li>
 *   <li><b>Pre-Authentication MFA Firewall:</b> If the token carries {@code scope: "PRE_MFA"}, restricts access strictly
 *       to {@code /api/users/mfa/*} endpoints. Any attempt to reach business resources returns HTTP 403 Forbidden.</li>
 *   <li><b>Security Context Establishment:</b> Populates {@link SecurityContextHolder} with {@link UsernamePasswordAuthenticationToken}
 *       bearing normalized {@code ROLE_<ROLE>} authorities and client request IP metadata.</li>
 * </ul>
 *
 * @author Futane Agro Core Architecture Team
 */
@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    /**
     * Inspects inbound request headers, validates JWT integrity and revocation, and establishes security context.
     *
     * @param request  inbound servlet request
     * @param response outbound servlet response
     * @param chain    filter chain sequence
     * @throws ServletException on servlet protocol exceptions
     * @throws IOException      on stream read/write faults
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);

            if (tokenBlacklistService != null && tokenBlacklistService.isBlacklisted(jwt)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\": \"Token has been revoked/blacklisted. Please log in again.\"}");
                return;
            }

            try {
                if (jwtUtils.isPreAuthToken(jwt)) {
                    String uri = request.getRequestURI();
                    if (!uri.contains("/api/users/mfa/")) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Pre-authentication token cannot access protected business resources. Complete MFA verification.\"}");
                        return;
                    }
                } else {
                    username = jwtUtils.extractUsername(jwt);
                }
            } catch (Exception e) {
                // Token parsing failed (expired or invalid)
                logger.warn("JWT token validation failed: " + e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtils.validateToken(jwt, username)) {
                String role = jwtUtils.extractClaim(jwt, claims -> claims.get("role", String.class));
                if (role != null && !role.isBlank()) {
                    String sanitizedRole = role.trim().toUpperCase();
                    if (sanitizedRole.startsWith("ROLE_")) {
                        sanitizedRole = sanitizedRole.substring(5);
                    }
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + sanitizedRole))
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
