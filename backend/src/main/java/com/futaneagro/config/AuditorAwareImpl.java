package com.futaneagro.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Spring Data JPA Automatic Auditor Resolver.
 * <p>
 * Injects the authenticated operator's username into entity auditing fields ({@code @CreatedBy} and {@code @LastModifiedBy})
 * extending {@code BaseEntity}:
 * <ul>
 *   <li>Inspects {@link SecurityContextHolder#getContext()} for an active authentication token.</li>
 *   <li>Falls back gracefully to {@code "system"} for unauthenticated or background daemon tasks.</li>
 * </ul>
 *
 * @author Futane Agro Core Architecture Team
 */
@Component("auditorAwareImpl")
public class AuditorAwareImpl implements AuditorAware<String> {

    /**
     * Resolves the current auditor identity for automatic JPA entity stamping.
     */
    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.of("system");
        }
        return Optional.ofNullable(auth.getName());
    }
}
