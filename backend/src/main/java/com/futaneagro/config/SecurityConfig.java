package com.futaneagro.config;

import com.futaneagro.security.JwtRequestFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
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
            .antMatchers("/api/users/login", "/api/users/login/verify", "/api/users/verify-session").permitAll()
            .antMatchers("/api/webhooks/razorpay").permitAll() // Razorpay webhook — no JWT possible
            .antMatchers("/api/uploads/**").permitAll() // Serve public files
            .antMatchers("/api/health").permitAll() // Health Check Endpoint
            .antMatchers("/actuator/**").permitAll() // Actuator Prometheus Metrics
            
            // Administrative Endpoints
            .antMatchers("/api/users/**").hasRole("SUPER_ADMIN")
            .antMatchers("/api/settings/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
            .antMatchers("/api/audit-logs/**").hasAnyRole("SUPER_ADMIN", "ADMIN")
            
            // Read-only (GET) allowed to all roles including VIEWER
            .antMatchers(HttpMethod.GET, "/api/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "OPERATOR", "VIEWER")
            
            // Role-specific write permissions
            .antMatchers("/api/payments/**", "/api/expenses/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
            .antMatchers("/api/salaries/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
            .antMatchers("/api/sales/**", "/api/parties/**", "/api/invoices/**", "/api/vendors/**", "/api/bank/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
            .antMatchers("/api/ppd/**", "/api/ppm/**", "/api/inventory/**", "/api/raw-materials/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
            .antMatchers("/api/production/**", "/api/machines/**", "/api/dispatch/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
            
            // All other modification endpoints require ADMIN or SUPER_ADMIN
            .anyRequest().hasAnyRole("SUPER_ADMIN", "ADMIN")
            .and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        http.headers()
            .frameOptions().deny()
            .contentTypeOptions().and()
            .httpStrictTransportSecurity().includeSubDomains(true).maxAgeInSeconds(31536000).and()
            .referrerPolicy().and()
            .addHeaderWriter(new org.springframework.security.web.header.writers.StaticHeadersWriter(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://api.razorpay.com https://80-225-192-171.sslip.io; img-src 'self' data: blob:;"
            ))
            .cacheControl().disable();

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:4200",
            "http://localhost:4201",
            "http://localhost:8081",
            "http://localhost",
            "http://127.0.0.1",
            "https://80-225-192-171.sslip.io",
            "https://uat.80-225-192-171.sslip.io",
            "https://erp.futaneagro.com",
            "https://uat.futaneagro.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "X-Razorpay-Signature"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
