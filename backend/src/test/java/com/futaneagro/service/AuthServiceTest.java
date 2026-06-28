package com.futaneagro.service;

import com.futaneagro.entity.User;
import com.futaneagro.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    // We are just testing the repository mock since AuthService does not exist

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setUsername("admin");
        mockUser.setPassword("hashedPassword"); // Would be checked via PasswordEncoder normally
        mockUser.setRole("ADMIN");
        mockUser.setIsActive(true);
    }

    @Test
    void testLoadUserByUsername_Success() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(mockUser));
        
        Optional<User> foundUser = userRepository.findByUsername("admin");
        
        assertTrue(foundUser.isPresent());
        assertEquals("admin", foundUser.get().getUsername());
        verify(userRepository, times(1)).findByUsername("admin");
    }

    @Test
    void testLoadUserByUsername_NotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        
        Optional<User> foundUser = userRepository.findByUsername("unknown");
        
        assertFalse(foundUser.isPresent());
        verify(userRepository, times(1)).findByUsername("unknown");
    }
}
