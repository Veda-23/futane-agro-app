package com.futaneagro.mfa;

import com.futaneagro.entity.User;
import com.futaneagro.entity.UserMfaRecoveryCode;
import com.futaneagro.repository.MfaUsedTokenRepository;
import com.futaneagro.repository.UserMfaRecoveryCodeRepository;
import com.futaneagro.repository.UserRepository;
import com.futaneagro.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FirebaseMfaServiceTest {

    @Mock
    private MfaProperties mfaProperties;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMfaRecoveryCodeRepository recoveryCodeRepository;

    @Mock
    private MfaUsedTokenRepository usedTokenRepository;

    @InjectMocks
    private FirebaseMfaService firebaseMfaService;

    private User testUser;

    @BeforeEach
    public void setup() {
        testUser = new User();
        testUser.setId("11111111-2222-3333-4444-555555555555");
        testUser.setUsername("testuser");
        testUser.setMobileNumber("+919876543210");
        testUser.setMfaEnabled(true);
        testUser.setMfaFactor("PHONE_FIREBASE");
    }

    @Test
    public void testPhoneMasking() {
        assertEquals("+91******3210", firebaseMfaService.maskPhone("+919876543210"));
        assertEquals("******3210", firebaseMfaService.maskPhone("9876543210"));
        assertEquals("****", firebaseMfaService.maskPhone("123"));
        assertEquals("N/A", firebaseMfaService.maskPhone(null));
    }

    @Test
    public void testPhoneNormalizationE164() {
        assertEquals("+919876543210", firebaseMfaService.normalizeE164("9876543210"));
        assertEquals("+919876543210", firebaseMfaService.normalizeE164("+91 98765-43210"));
        assertEquals("+14155552671", firebaseMfaService.normalizeE164("+1 (415) 555-2671"));
    }

    @Test
    public void testGenerateRecoveryCodes() {
        when(recoveryCodeRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        List<String> codes = firebaseMfaService.generateRecoveryCodes(testUser.getId());

        assertNotNull(codes);
        assertEquals(10, codes.size());
        for (String code : codes) {
            assertTrue(code.matches("^[A-Z0-9]{5}-[A-Z0-9]{5}$"), "Recovery code must match 5-5 pattern: " + code);
        }
        verify(recoveryCodeRepository, times(1)).deleteByUserId(testUser.getId());
        verify(recoveryCodeRepository, times(1)).saveAll(any());
    }

    @Test
    public void testPreAuthJwtLifecycle() {
        JwtUtils jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "secret", "FutaneAgroERPTestSecretKeyForTestingJwtUtils32BytesMin");
        ReflectionTestUtils.setField(jwtUtils, "expiration", 900000L);

        String preAuthToken = jwtUtils.generatePreAuthToken(testUser.getId(), testUser.getUsername(), "PHONE_FIREBASE");

        assertNotNull(preAuthToken);
        assertTrue(jwtUtils.isPreAuthToken(preAuthToken));
        assertTrue(jwtUtils.validatePreAuthToken(preAuthToken));
        assertEquals(testUser.getId(), jwtUtils.extractUserId(preAuthToken));
        assertEquals("PHONE_FIREBASE", jwtUtils.extractFactor(preAuthToken));
        assertEquals(testUser.getUsername(), jwtUtils.extractUsername(preAuthToken));
    }

    @Test
    public void testVerifyRecoveryCodeSuccess() {
        // Prepare pre-hashed code
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder =
                new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        String plainCode = "ABCDE-12345";
        String hashedCode = encoder.encode("ABCDE12345");

        UserMfaRecoveryCode codeEntity = new UserMfaRecoveryCode(testUser.getId(), hashedCode);
        when(recoveryCodeRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(Collections.singletonList(codeEntity));

        boolean result = firebaseMfaService.verifyRecoveryCode(testUser, plainCode);

        assertTrue(result);
        assertTrue(codeEntity.getUsed());
        assertNotNull(codeEntity.getUsedAt());
        verify(recoveryCodeRepository, times(1)).save(codeEntity);
    }

    @Test
    public void testVerifyRecoveryCodeFailure() {
        org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder =
                new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        String hashedCode = encoder.encode("ABCDE12345");

        UserMfaRecoveryCode codeEntity = new UserMfaRecoveryCode(testUser.getId(), hashedCode);
        when(recoveryCodeRepository.findByUserIdAndUsedFalse(testUser.getId()))
                .thenReturn(Collections.singletonList(codeEntity));

        boolean result = firebaseMfaService.verifyRecoveryCode(testUser, "WRONG-99999");

        assertFalse(result);
        assertFalse(codeEntity.getUsed());
    }
}
