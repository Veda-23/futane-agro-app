package com.futaneagro.controller;

import com.futaneagro.entity.User;
import com.futaneagro.repository.UserRepository;
import com.futaneagro.security.JwtUtils;
import com.futaneagro.service.EmailService;
import com.futaneagro.service.SmsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.core.env.Environment;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests for {@link AuthController}.
 *
 * • Verifies that missing credentials return 400.
 * • Ensures the intentional back‑door has been removed (root login returns 401).
 * • Confirms a normal user can successfully log in and receives an OTP_REQUIRED response.
 */
@WebMvcTest(AuthController.class)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private Environment environment;

    @MockBean
    private EmailService emailService;

    @MockBean
    private SmsService smsService;

    @BeforeEach
    public void setUp() {
        // By default, repository returns empty for any username.
        when(userRepository.findById(anyString())).thenReturn(Optional.empty());
        // Environment with no active profiles (non‑production).
        when(environment.getActiveProfiles()).thenReturn(new String[]{});
    }

    @Test
    public void testLogin_WithoutCredentials_Returns400() throws Exception {
        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testLogin_RootBackdoorRemoved_Returns401() throws Exception {
        String payload = "{\"username\":\"root\",\"password\":\"supersecretpassword123!\"}";
        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testLogin_ValidUser_ReturnsOtpRequired() throws Exception {
        // Mock a user record
        User user = new User();
        user.setUsername("jdoe");
        user.setPassword("encoded-pass"); // password will be checked via passwordEncoder
        user.setEmail("jdoe@example.com");
        user.setName("John Doe");
        user.setRole("ROLE_USER");
        // Repository returns the user
        when(userRepository.findById("jdoe")).thenReturn(Optional.of(user));
        // PasswordEncoder says the password matches
        when(passwordEncoder.matches("secret", "encoded-pass")).thenReturn(true);
        // JWT generation (value irrelevant for this test)
        when(jwtUtils.generateToken(anyString(), anyString())).thenReturn("jwt-token");
        // Email/SMS services are mocked to do nothing (they are called inside a try/catch)
        Mockito.doNothing().when(emailService).sendOtpEmail(Mockito.anyString(), Mockito.anyString(), Mockito.anyString());
        Mockito.doNothing().when(smsService).sendOtpSms(Mockito.anyString(), Mockito.anyString());

        String payload = "{\"username\":\"jdoe\",\"password\":\"secret\"}";
        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk()); // 200 OK, body contains OTP_REQUIRED status
    }
}
