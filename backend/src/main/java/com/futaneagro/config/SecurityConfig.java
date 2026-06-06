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
            .antMatchers("/api/users/login", "/api/users/login/verify").permitAll()
            .antMatchers("/api/uploads/**").permitAll() // Serve public files
            
            // SUPER_ADMIN Only Administrative Endpoints
            .antMatchers("/api/users/**").hasRole("SUPER_ADMIN")
            .antMatchers("/api/settings/**").hasRole("SUPER_ADMIN")
            .antMatchers("/api/audit-logs/**").hasRole("SUPER_ADMIN")
            
            // Read-only (GET) allowed to all roles including VIEWER
            .antMatchers(HttpMethod.GET, "/api/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "OPERATOR", "VIEWER")
            
            // Role-specific write permissions
            .antMatchers("/api/payments/**", "/api/expenses/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
            .antMatchers("/api/salaries/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
            .antMatchers("/api/ppd/**", "/api/ppm/**", "/api/inventory/**", "/api/raw-materials/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "OPERATOR")
            
            // All other modification endpoints require ADMIN or SUPER_ADMIN
            .anyRequest().hasAnyRole("SUPER_ADMIN", "ADMIN")
            .and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
