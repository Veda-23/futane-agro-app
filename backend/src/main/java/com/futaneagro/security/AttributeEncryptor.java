package com.futaneagro.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import javax.persistence.AttributeConverter;
import javax.persistence.Converter;
import java.security.Key;
import java.util.Base64;

@Component
@Converter
public class AttributeEncryptor implements AttributeConverter<String, String> {

    private static final String AES = "AES";
    private final Key key;
    private final Cipher encryptCipher;
    private final Cipher decryptCipher;

    // Inject the 32-character key from application.properties
    public AttributeEncryptor(@Value("${app.encryption.key}") String secretKey) throws Exception {
        this.key = new SecretKeySpec(secretKey.getBytes(), AES);
        this.encryptCipher = Cipher.getInstance(AES);
        this.encryptCipher.init(Cipher.ENCRYPT_MODE, key);
        this.decryptCipher = Cipher.getInstance(AES);
        this.decryptCipher.init(Cipher.DECRYPT_MODE, key);
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            synchronized (encryptCipher) {
                return Base64.getEncoder().encodeToString(encryptCipher.doFinal(attribute.getBytes()));
            }
        } catch (Exception e) {
            throw new IllegalStateException("Could not encrypt attribute: " + e.getMessage(), e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            synchronized (decryptCipher) {
                return new String(decryptCipher.doFinal(Base64.getDecoder().decode(dbData)));
            }
        } catch (Exception e) {
            throw new IllegalStateException("Could not decrypt database value: " + e.getMessage(), e);
        }
    }
}
