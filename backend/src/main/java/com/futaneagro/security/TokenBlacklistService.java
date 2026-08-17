package com.futaneagro.security;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private final Set<String> blacklistedTokens = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public void blacklistToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        if (token != null && !token.trim().isEmpty()) {
            blacklistedTokens.add(token.trim());
        }
    }

    public boolean isBlacklisted(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return token != null && blacklistedTokens.contains(token.trim());
    }
}
