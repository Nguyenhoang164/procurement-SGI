package com.sgiprocurement.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret",
                "test-secret-key-for-unit-testing-purposes-only-12345678901234567890");
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 86400000L);
    }

    @Test
    void generateToken_shouldCreateValidToken() {
        String token = jwtTokenProvider.generateToken(1L, "testuser", "ADMIN");

        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3);
    }

    @Test
    void getUsernameFromToken_shouldReturnCorrectUsername() {
        String token = jwtTokenProvider.generateToken(1L, "testuser", "ADMIN");

        String username = jwtTokenProvider.getUsernameFromToken(token);

        assertEquals("testuser", username);
    }

    @Test
    void getUserIdFromToken_shouldReturnCorrectUserId() {
        String token = jwtTokenProvider.generateToken(42L, "testuser", "ADMIN");

        Long userId = jwtTokenProvider.getUserIdFromToken(token);

        assertEquals(42L, userId);
    }

    @Test
    void getRoleFromToken_shouldReturnCorrectRole() {
        String token = jwtTokenProvider.generateToken(1L, "testuser", "MANAGER");

        String role = jwtTokenProvider.getRoleFromToken(token);

        assertEquals("MANAGER", role);
    }

    @Test
    void validateToken_shouldReturnTrue_forValidToken() {
        String token = jwtTokenProvider.generateToken(1L, "testuser", "USER");

        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void validateToken_shouldReturnFalse_forInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid-token"));
    }

    @Test
    void validateToken_shouldReturnFalse_forExpiredToken() {
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", -1000L);
        String token = jwtTokenProvider.generateToken(1L, "testuser", "USER");

        assertFalse(jwtTokenProvider.validateToken(token));
    }

    @Test
    void generateToken_shouldProduceDifferentTokens_forDifferentUsers() {
        String token1 = jwtTokenProvider.generateToken(1L, "user1", "USER");
        String token2 = jwtTokenProvider.generateToken(2L, "user2", "ADMIN");

        assertNotEquals(token1, token2);
    }
}
