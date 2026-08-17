package com.futaneagro.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import org.springframework.context.annotation.Lazy;

@Component
@Converter
@Lazy
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final String AES = "AES";
    private static final String AES_CBC = "AES/CBC/PKCS5Padding";
    private static final String AES_ECB = "AES/ECB/PKCS5Padding";
    private static final int IV_SIZE = 16;

    private final Key key;
    private final SecureRandom secureRandom = new SecureRandom();

    public AttributeEncryptor(@Value("${app.encryption.key}") String secretKey) {
        this.key = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), AES);
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_SIZE];
            secureRandom.nextBytes(iv);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance(AES_CBC);
            cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);
            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[IV_SIZE + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, IV_SIZE);
            System.arraycopy(encrypted, 0, combined, IV_SIZE, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Could not encrypt attribute: " + e.getMessage(), e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(dbData);
            if (combined.length > IV_SIZE) {
                try {
                    byte[] iv = Arrays.copyOfRange(combined, 0, IV_SIZE);
                    byte[] encrypted = Arrays.copyOfRange(combined, IV_SIZE, combined.length);
                    IvParameterSpec ivSpec = new IvParameterSpec(iv);

                    Cipher cipher = Cipher.getInstance(AES_CBC);
                    cipher.init(Cipher.DECRYPT_MODE, key, ivSpec);
                    return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
                } catch (Exception cbcEx) {
                    // Fallback to legacy ECB mode
                    return decryptEcb(combined);
                }
            } else {
                return decryptEcb(combined);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Could not decrypt database value: " + e.getMessage(), e);
        }
    }

    private String decryptEcb(byte[] cipherBytes) {
        try {
            Cipher cipher = Cipher.getInstance(AES_ECB);
            cipher.init(Cipher.DECRYPT_MODE, key);
            return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("ECB fallback decryption failed: " + e.getMessage(), e);
        }
    }
}
