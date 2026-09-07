package com.futaneagro.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

/**
 * AES-256-GCM Authenticated Encryption for JPA entity attributes.
 *
 * SECURITY UPGRADE from AES/CBC:
 * - GCM provides AUTHENTICATION (detects tampering) — CBC does NOT.
 * - GCM is not vulnerable to padding oracle attacks (POODLE/BEAST) — CBC IS.
 * - 12-byte IV (recommended for GCM) generated per encryption via SecureRandom.
 * - 128-bit authentication tag appended to ciphertext.
 *
 * Backwards Compatibility & Resilience:
 * - Supports primary configured key and fallback historical keys.
 * - Auto-detects GCM vs legacy CBC vs plaintext.
 * - Non-fatal fallback prevents single-attribute decryption failures from crashing queries.
 *
 * Wire Format (GCM): base64( "GCM:" + 12-byte IV + 16-byte auth-tag + ciphertext )
 * Wire Format (CBC, legacy): base64( 16-byte IV + ciphertext )
 */
@Component
@Converter
@Lazy
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final Logger logger = LoggerFactory.getLogger(AttributeEncryptor.class);

    private static final String GCM_ALGO  = "AES/GCM/NoPadding";
    private static final String CBC_ALGO  = "AES/CBC/PKCS5Padding";
    private static final String ECB_ALGO  = "AES/ECB/PKCS5Padding"; // legacy only

    private static final int GCM_IV_LEN   = 12;  // Recommended for GCM
    private static final int GCM_TAG_BITS = 128; // 128-bit auth tag

    private static final int CBC_IV_LEN   = 16;  // AES block size
    private static final String GCM_MARKER = "GCM:";

    private final SecretKey key;
    private final List<SecretKey> fallbackKeys = new ArrayList<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public AttributeEncryptor(@Value("${app.encryption.key:FutaneAgroERPPRODEncryptionKeySe}") String secretKey) {
        this.key = deriveKey(secretKey);

        // Add known historical keys as fallback for seamless migration
        String[] historicalKeys = {
            "FutaneAgroERPPRODEncryptionKeySe",
            "FutaneAgroERPUATEncryptionKeySec"
        };
        for (String hk : historicalKeys) {
            SecretKey candidate = deriveKey(hk);
            if (!Arrays.equals(candidate.getEncoded(), this.key.getEncoded())) {
                fallbackKeys.add(candidate);
            }
        }
    }

    private static SecretKey deriveKey(String rawKey) {
        byte[] keyBytes = rawKey.getBytes(StandardCharsets.UTF_8);
        byte[] key32 = new byte[32];
        System.arraycopy(keyBytes, 0, key32, 0, Math.min(keyBytes.length, 32));
        return new SecretKeySpec(key32, "AES");
    }

    // ─── Encrypt (always GCM with primary key) ─────────────────────────────────

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) return null;
        try {
            byte[] iv = new byte[GCM_IV_LEN];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(GCM_ALGO);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            // Layout: GCM_MARKER + iv (12) + ciphertext+tag (N+16)
            byte[] marker = GCM_MARKER.getBytes(StandardCharsets.US_ASCII);
            ByteBuffer buf = ByteBuffer.allocate(marker.length + iv.length + encrypted.length);
            buf.put(marker);
            buf.put(iv);
            buf.put(encrypted);

            return Base64.getEncoder().encodeToString(buf.array());

        } catch (Exception e) {
            throw new IllegalStateException("GCM encryption failed: " + e.getMessage(), e);
        }
    }

    // ─── Decrypt (auto-detect GCM vs CBC legacy, multi-key fallback) ──────────

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) return null;
        try {
            byte[] raw = Base64.getDecoder().decode(dbData);

            // Check for GCM marker
            byte[] marker = GCM_MARKER.getBytes(StandardCharsets.US_ASCII);
            if (raw.length > marker.length && startsWith(raw, marker)) {
                return decryptGcmWithFallbacks(raw, marker.length, dbData);
            }

            // Fallback: try legacy CBC (IV in first 16 bytes)
            return decryptCbcWithFallbacks(raw, dbData);

        } catch (IllegalArgumentException notBase64) {
            // Raw unencrypted plaintext data
            return dbData;
        } catch (Exception e) {
            logger.warn("Attribute decryption failed: {}. Falling back to raw value.", e.getMessage());
            return dbData;
        }
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private String decryptGcmWithFallbacks(byte[] raw, int offset, String rawDbData) {
        byte[] iv = Arrays.copyOfRange(raw, offset, offset + GCM_IV_LEN);
        byte[] ciphertext = Arrays.copyOfRange(raw, offset + GCM_IV_LEN, raw.length);

        // Try primary key first
        try {
            return decryptGcmSingleKey(key, iv, ciphertext);
        } catch (Exception primaryEx) {
            // Try fallback keys
            for (SecretKey fk : fallbackKeys) {
                try {
                    return decryptGcmSingleKey(fk, iv, ciphertext);
                } catch (Exception ignored) {
                }
            }
            logger.warn("GCM decryption failed with all configured keys. Returning raw database value.");
            return rawDbData;
        }
    }

    private String decryptGcmSingleKey(SecretKey k, byte[] iv, byte[] ciphertext) throws Exception {
        Cipher cipher = Cipher.getInstance(GCM_ALGO);
        cipher.init(Cipher.DECRYPT_MODE, k, new GCMParameterSpec(GCM_TAG_BITS, iv));
        return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    }

    /** Legacy CBC decryption — read-only migration path with fallback keys. */
    private String decryptCbcWithFallbacks(byte[] combined, String rawDbData) {
        if (combined.length > CBC_IV_LEN) {
            byte[] iv = Arrays.copyOfRange(combined, 0, CBC_IV_LEN);
            byte[] ciphertext = Arrays.copyOfRange(combined, CBC_IV_LEN, combined.length);

            // Try primary key
            try {
                return decryptCbcSingleKey(key, iv, ciphertext);
            } catch (Exception e1) {
                for (SecretKey fk : fallbackKeys) {
                    try {
                        return decryptCbcSingleKey(fk, iv, ciphertext);
                    } catch (Exception ignored) {}
                }
            }
        }
        return decryptEcbWithFallbacks(combined, rawDbData);
    }

    private String decryptCbcSingleKey(SecretKey k, byte[] iv, byte[] ciphertext) throws Exception {
        Cipher cipher = Cipher.getInstance(CBC_ALGO);
        cipher.init(Cipher.DECRYPT_MODE, k, new javax.crypto.spec.IvParameterSpec(iv));
        return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    }

    /** Legacy ECB decryption — read-only, only for very old data. */
    private String decryptEcbWithFallbacks(byte[] cipherBytes, String rawDbData) {
        try {
            Cipher cipher = Cipher.getInstance(ECB_ALGO);
            cipher.init(Cipher.DECRYPT_MODE, key);
            return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
        } catch (Exception e) {
            for (SecretKey fk : fallbackKeys) {
                try {
                    Cipher cipher = Cipher.getInstance(ECB_ALGO);
                    cipher.init(Cipher.DECRYPT_MODE, fk);
                    return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
                } catch (Exception ignored) {}
            }
            logger.warn("ECB decryption failed with all configured keys. Returning raw database value.");
            return rawDbData;
        }
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
