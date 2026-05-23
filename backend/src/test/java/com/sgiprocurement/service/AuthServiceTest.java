package com.sgiprocurement.service;

import com.sgiprocurement.config.JwtTokenProvider;
import com.sgiprocurement.dto.AuthResponse;
import com.sgiprocurement.dto.LoginRequest;
import com.sgiprocurement.model.User;
import com.sgiprocurement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private User activeUser;
    private User inactiveUser;
    private LoginRequest validRequest;
    private LoginRequest invalidPasswordRequest;

    @BeforeEach
    void setUp() {
        activeUser = new User();
        activeUser.setId(1L);
        activeUser.setUsername("testuser");
        activeUser.setPassword("encodedPassword");
        activeUser.setRole("USER");
        activeUser.setMarket("VN");
        activeUser.setActive(true);

        inactiveUser = new User();
        inactiveUser.setId(2L);
        inactiveUser.setUsername("inactive");
        inactiveUser.setPassword("encodedPassword");
        inactiveUser.setRole("USER");
        inactiveUser.setActive(false);

        validRequest = new LoginRequest("testuser", "password123");
        invalidPasswordRequest = new LoginRequest("testuser", "wrongpassword");
    }

    @Test
    void login_shouldSucceed_whenCredentialsAreValid() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtTokenProvider.generateToken(1L, "testuser", "USER")).thenReturn("test-jwt-token");

        AuthResponse response = authService.login(validRequest);

        assertNotNull(response);
        assertEquals("test-jwt-token", response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals(1L, response.getUserId());
        assertEquals("testuser", response.getUsername());
        assertEquals("USER", response.getRole());
        assertEquals("VN", response.getMarket());
    }

    @Test
    void login_shouldThrowException_whenUserNotFound() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("nonexistent", "password");

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_shouldThrowException_whenUserIsInactive() {
        when(userRepository.findByUsername("inactive")).thenReturn(Optional.of(inactiveUser));

        assertThrows(BadCredentialsException.class, () -> authService.login(new LoginRequest("inactive", "password")));
    }

    @Test
    void login_shouldThrowException_whenPasswordIsIncorrect() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongpassword", "encodedPassword")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(invalidPasswordRequest));
    }

    @Test
    void createAdminUser_shouldCreate_whenNotExists() {
        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(passwordEncoder.encode("admin@123")).thenReturn("encodedAdminPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.createAdminUser();

        verify(userRepository).save(argThat(user ->
                "admin".equals(user.getUsername()) &&
                "ADMIN".equals(user.getRole()) &&
                "All Markets".equals(user.getMarket()) &&
                user.getActive()
        ));
    }

    @Test
    void createAdminUser_shouldNotCreate_whenAlreadyExists() {
        when(userRepository.existsByUsername("admin")).thenReturn(true);

        authService.createAdminUser();

        verify(userRepository, never()).save(any(User.class));
    }
}
