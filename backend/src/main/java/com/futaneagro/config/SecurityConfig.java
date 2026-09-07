package com.futaneagro.config;

import com.futaneagro.security.JwtRequestFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.security.web.util.matcher.AnyRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().and().csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/users/login", "/api/users/login/verify", "/api/users/verify-session", "/api/users/refresh-token").permitAll()
            .antMatchers("/api/webhooks/razorpay").permitAll()
            .antMatchers(HttpMethod.GET, "/api/uploads/branding/**").permitAll()
            .antMatchers(HttpMethod.GET, "/api/uploads/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "OPERATOR", "VIEWER")
            .antMatchers(HttpMethod.POST, "/api/uploads/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "OPERATOR")
            .antMatchers("/api/health").permitAll()

            // ── SECURITY: Dev endpoints require explicit non-prod guard in the controller ──
            .antMatchers("/api/dev/**").hasAnyRole("SUPER_ADMIN", "ADMIN")

            // ── SECURITY: Actuator — only health & prometheus are public; rest require SUPER_ADMIN ──
            .antMatchers("/actuator/health", "/actuator/prometheus").permitAll()
            .antMatchers("/actuator/**").hasRole("SUPER_ADMIN")

            // Administrative Endpoints
            .antMatchers("/api/admin/branding", "/api/admin/features").permitAll()
            .antMatchers(HttpMethod.GET, "/api/admin/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "OPERATOR", "VIEWER")
            .antMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
            // Self-service user actions (logout, change password) open to all authenticated roles
            .antMatchers("/api/users/logout", "/api/users/change-password").authenticated()
            .antMatchers("/api/users/**").hasRole("SUPER_ADMIN")
            .antMatchers("/api/settings/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
            .antMatchers("/api/audit-logs/**").hasAnyRole("SUPER_ADMIN", "ADMIN")

            // Read-only (GET) allowed to all authenticated roles
            .antMatchers(HttpMethod.GET, "/api/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "OPERATOR", "VIEWER")

            // Role-specific write permissions
            .antMatchers("/api/payments/**", "/api/expenses/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
            .antMatchers("/api/salaries/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
            .antMatchers("/api/sales/**", "/api/parties/**", "/api/invoices/**", "/api/vendors/**", "/api/bank/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
            .antMatchers("/api/ppd/**", "/api/ppm/**", "/api/inventory/**", "/api/raw-materials/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
            .antMatchers("/api/production/**", "/api/machines/**", "/api/dispatch/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
            .antMatchers("/api/data-import/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "OPERATOR")
            .antMatchers("/api/adk/**", "/api/ai/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "OPERATOR", "VIEWER")

            .anyRequest().hasAnyRole("SUPER_ADMIN", "ADMIN")
            .and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        http.headers()
            // Prevent clickjacking
            .frameOptions().deny()
            // Prevent MIME sniffing
            .contentTypeOptions().and()
            // HSTS — 2 years, subdomains, preload list (applied unconditionally across proxy/app servers)
            .httpStrictTransportSecurity()
                .requestMatcher(AnyRequestMatcher.INSTANCE)
                .includeSubDomains(true)
                .maxAgeInSeconds(63072000)
                .preload(true)
            .and()
            // Referrer policy
            .referrerPolicy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN).and()
            // Content Security Policy — hardened (no unsafe-eval, supports WebSockets for live notifications)
            .addHeaderWriter(new StaticHeadersWriter(
                "Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com http://localhost:3000; " +
                "img-src 'self' data: blob:; " +
                "connect-src 'self' https://api.razorpay.com ws: wss:; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self';"
            ))
            // Permissions Policy — restrict browser features
            .addHeaderWriter(new StaticHeadersWriter(
                "Permissions-Policy",
                "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), fullscreen=(self)"
            ))
            // Legacy XSS protection
            .addHeaderWriter(new StaticHeadersWriter("X-XSS-Protection", "1; mode=block"))
            // Cross-Origin policies
            .addHeaderWriter(new StaticHeadersWriter("Cross-Origin-Opener-Policy", "same-origin"))
            .addHeaderWriter(new StaticHeadersWriter("Cross-Origin-Resource-Policy", "same-site"))
            // Standard API cache control (preserves custom Cache-Control on public assets)
            .cacheControl();

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",
            "http://localhost:4201",
            "http://localhost:8081",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost",
            "http://127.0.0.1",
            "https://80-225-192-171.sslip.io",
            "https://uat.80-225-192-171.sslip.io",
            "https://erp.futaneagro.com",
            "https://uat.futaneagro.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", "Cache-Control", "Content-Type", "X-Razorpay-Signature",
            "Accept", "Origin", "X-Requested-With"
        ));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight OPTIONS for 1 hour
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
