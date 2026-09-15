package com.futaneagro.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Caffeine-backed CacheManager with bounded size and TTL.
     * Previously used ConcurrentMapCacheManager which:
     *   (a) silently overrode the spring.cache.type=caffeine property, and
     *   (b) had no eviction, TTL, or size limit — caches grew unboundedly.
     *
     * Now: max 1000 entries per cache, expire 10 min after last write.
     * Cache names mirror the spring.cache.cache-names property.
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheNames(Arrays.asList(
                "parties", "vendors", "drivers", "employees", "machines",
                "settings", "teams", "permissions", "features", "branding",
                "rolePermissions", "featureFlags", "customFields",
                "dashboard_stats", "dashboard_charts"
        ));
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats() // enables Actuator cache metrics
        );
        return cacheManager;
    }
}
