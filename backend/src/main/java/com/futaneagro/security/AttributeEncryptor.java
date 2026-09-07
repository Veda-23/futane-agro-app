package com.futaneagro.security;

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
import java.util.Arrays;
import java.util.Base64;

/**
 * AES-256-GCM Authenticated Encryption for JPA entity attributes.
 *
 * SECURITY UPGRADE from AES/CBC:
 * - GCM provides AUTHENTICATION (detects tampering) — CBC does NOT.
 * - GCM is not vulnerable to padding oracle attacks (POODLE/BEAST) — CBC IS.
 * - 12-byte IV (recommended for GCM) generated per encryption via SecureRandom.
 * - 128-bit authentication tag appended to ciphertext.
 *
 * Backwards Compatibility:
 * - Detects old CBC-format ciphertext (base64, 16-byte IV prefix) and decrypts
 *   it using the old CBC path (READ-ONLY migration path).
 * - New writes always use GCM.
 *
 * Wire Format (GCM): base64( "GCM:" + 12-byte IV + 16-byte auth-tag + ciphertext )
 * Wire Format (CBC, legacy): base64( 16-byte IV + ciphertext )
 */
@Component
@Converter
@Lazy
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final String GCM_ALGO  = "AES/GCM/NoPadding";
    private static final String CBC_ALGO  = "AES/CBC/PKCS5Padding";
    private static final String ECB_ALGO  = "AES/ECB/PKCS5Padding"; // legacy only

    private static final int GCM_IV_LEN   = 12;  // Recommended for GCM
    private static final int GCM_TAG_BITS = 128; // 128-bit auth tag

    private static final int CBC_IV_LEN   = 16;  // AES block size
    private static final String GCM_MARKER = "GCM:";

    private final SecretKey key;
    private final SecureRandom secureRandom = new SecureRandom();

    public AttributeEncryptor(@Value("${app.encryption.key}") String secretKey) {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        // Pad or trim to exactly 32 bytes for AES-256
        byte[] key32 = new byte[32];
        System.arraycopy(keyBytes, 0, key32, 0, Math.min(keyBytes.length, 32));
        this.key = new SecretKeySpec(key32, "AES");
    }

    // ─── Encrypt (always GCM) ─────────────────────────────────────────────────

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

    // ─── Decrypt (auto-detect GCM vs CBC legacy) ──────────────────────────────

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) return null;
        try {
            byte[] raw = Base64.getDecoder().decode(dbData);

            // Check for GCM marker
            byte[] marker = GCM_MARKER.getBytes(StandardCharsets.US_ASCII);
            if (raw.length > marker.length && startsWith(raw, marker)) {
                return decryptGcm(raw, marker.length);
            }

            // Fallback: try legacy CBC (IV in first 16 bytes)
            return decryptCbcLegacy(raw);

        } catch (Exception e) {
            throw new IllegalStateException("Decryption failed: " + e.getMessage(), e);
        }
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private String decryptGcm(byte[] raw, int offset) throws Exception {
        byte[] iv = Arrays.copyOfRange(raw, offset, offset + GCM_IV_LEN);
        byte[] ciphertext = Arrays.copyOfRange(raw, offset + GCM_IV_LEN, raw.length);

        Cipher cipher = Cipher.getInstance(GCM_ALGO);
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
        return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    }

    /** Legacy CBC decryption — read-only migration path. */
    private String decryptCbcLegacy(byte[] combined) throws Exception {
        if (combined.length > CBC_IV_LEN) {
            try {
                byte[] iv = Arrays.copyOfRange(combined, 0, CBC_IV_LEN);
                byte[] ciphertext = Arrays.copyOfRange(combined, CBC_IV_LEN, combined.length);
                Cipher cipher = Cipher.getInstance(CBC_ALGO);
                cipher.init(Cipher.DECRYPT_MODE, key,
                    new javax.crypto.spec.IvParameterSpec(iv));
                return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
            } catch (Exception cbcEx) {
                return decryptEcbLegacy(combined);
            }
        }
        return decryptEcbLegacy(combined);
    }

    /** Legacy ECB decryption — read-only, only for very old data. */
    private String decryptEcbLegacy(byte[] cipherBytes) throws Exception {
        Cipher cipher = Cipher.getInstance(ECB_ALGO);
        cipher.init(Cipher.DECRYPT_MODE, key);
        return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
