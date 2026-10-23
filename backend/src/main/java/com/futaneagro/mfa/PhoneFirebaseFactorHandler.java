package com.futaneagro.mfa;

import com.futaneagro.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * <h1>PhoneFirebaseFactorHandler (SMS Phone Multi-Factor Authentication Strategy)</h1>
 * <p>
 * Implementation of {@link MfaFactorHandler} providing SMS OTP verification via the Firebase Admin SDK.
 * Masks recipient phone numbers (e.g. "+91 98*** **321") for UI challenges and validates cryptographic ID tokens.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Component
public class PhoneFirebaseFactorHandler implements MfaFactorHandler {

    public static final String FACTOR_TYPE = "PHONE_FIREBASE";

    @Autowired
    private FirebaseMfaService firebaseMfaService;

    @Override
    public String getFactorType() {
        return FACTOR_TYPE;
    }

    @Override
    public Map<String, Object> createChallengeData(User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("factor", FACTOR_TYPE);
        String phone = user.getMfaPhoneE164();
        if (phone == null || phone.isBlank()) {
            phone = user.getMobileNumber();
        }
        data.put("maskedPhone", firebaseMfaService.maskPhone(phone));
        return data;
    }

    @Override
    public boolean verify(User user, Map<String, Object> payload) {
        String firebaseIdToken = (String) payload.get("firebaseIdToken");
        return firebaseMfaService.verifyFirebaseIdToken(user, firebaseIdToken);
    }
}
