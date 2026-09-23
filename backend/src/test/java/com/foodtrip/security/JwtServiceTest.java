package com.foodtrip.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String TEST_SECRET = "sgvasfwtacwetvcsgsghscsvtswtvwtvesgxwctvecxwtgvehcvyescevyusecevryeye";
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET);
    }

    @Test
    void testGenerateAndValidateAccessToken() {
        String token = jwtService.generateToken("user@example.com");

        assertNotNull(token);
        assertTrue(jwtService.validateToken(token));
        assertTrue(jwtService.isAccessToken(token));
        assertEquals("user@example.com", jwtService.getUsername(token));
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    void testValidateToken_MalformedTokenReturnsFalse() {
        assertFalse(jwtService.validateToken("invalid.token.structure"));
        assertFalse(jwtService.validateToken(""));
        assertFalse(jwtService.validateToken(null));
    }

    @Test
    void testValidateToken_InvalidSignatureReturnsFalse() {
        JwtService anotherService = new JwtService("anothersecretkeythatisverylongandvalidforhmacsha256testingpurposes123");
        String token = anotherService.generateToken("user@example.com", true);

        assertFalse(jwtService.validateToken(token));
    }
}
