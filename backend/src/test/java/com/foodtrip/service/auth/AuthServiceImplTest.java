package com.foodtrip.service.auth;

import com.foodtrip.security.JwtService;
import com.foodtrip.dto.auth.JwtResponse;
import com.foodtrip.dto.auth.LoginRequest;
import com.foodtrip.dto.auth.UserRegisterRequest;
import com.foodtrip.dto.restaurant.RestaurantDto;
import com.foodtrip.dto.user.UserDto;
import com.foodtrip.entity.user.Role;
import com.foodtrip.entity.user.User;
import com.foodtrip.exception.ResourceNotFoundException;
import com.foodtrip.repository.user.UserRepository;
import com.foodtrip.service.restaurant.RestaurantService;
import com.foodtrip.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserService userService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private RestaurantService restaurantService;

    private ModelMapper modelMapper;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        modelMapper = new ModelMapper();
        authService = new AuthServiceImpl(
                userService,
                passwordEncoder,
                authenticationManager,
                userDetailsService,
                modelMapper,
                userRepository,
                jwtService,
                restaurantService
        );
    }

    @Test
    void testRegisterUser_AsCustomer() {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setName("John Doe");
        request.setEmail("john@example.com");
        request.setPassword("plainPassword");
        request.setRole("CUSTOMER");

        when(passwordEncoder.encode("plainPassword")).thenReturn("encodedPassword");
        when(userService.saveUser(any(UserDto.class))).thenAnswer(invocation -> {
            UserDto dto = invocation.getArgument(0);
            dto.setId("user-123");
            return dto;
        });
        when(jwtService.generateToken("john@example.com", true)).thenReturn("jwt-token-123");

        JwtResponse response = authService.registerUser(request);

        assertNotNull(response);
        assertEquals("jwt-token-123", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("user-123", response.getUser().getId());
        assertEquals("John Doe", response.getUser().getName());
        assertEquals("john@example.com", response.getUser().getEmail());
        assertEquals("encodedPassword", response.getUser().getPassword());
        assertEquals(Role.CUSTOMER, response.getUser().getRole());
        assertTrue(response.getUser().isEnabled());
        assertNotNull(response.getUser().getCreatedDate());

        verify(restaurantService, never()).createDefaultRestaurantForUser(any());
        verify(userRepository, never()).findById(anyString());
    }

    @Test
    void testRegisterUser_EmailAlreadyExists() {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setName("Duplicate User");
        request.setEmail("duplicate@example.com");
        request.setPassword("password123");
        request.setRole("CUSTOMER");

        when(userRepository.existsByEmail("duplicate@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.registerUser(request));
        verify(userService, never()).saveUser(any());
    }

    @Test
    void testRegisterUser_AsRestaurant() {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setName("Chef Mario");
        request.setEmail("mario@restaurant.com");
        request.setPassword("marioPass");
        request.setRole("Restaurant");

        when(passwordEncoder.encode("marioPass")).thenReturn("encodedMarioPass");
        when(userService.saveUser(any(UserDto.class))).thenAnswer(invocation -> {
            UserDto dto = invocation.getArgument(0);
            dto.setId("user-restaurant-1");
            return dto;
        });

        RestaurantDto mockRestaurant = new RestaurantDto();
        mockRestaurant.setId("rest-999");
        when(restaurantService.createDefaultRestaurantForUser(any(UserDto.class))).thenReturn(mockRestaurant);

        User existingUser = new User();
        existingUser.setId("user-restaurant-1");
        when(userRepository.findById("user-restaurant-1")).thenReturn(Optional.of(existingUser));
        when(jwtService.generateToken("mario@restaurant.com", true)).thenReturn("restaurant-jwt-token");

        JwtResponse response = authService.registerUser(request);

        assertNotNull(response);
        assertEquals("restaurant-jwt-token", response.getToken());
        assertEquals("rest-999", response.getUser().getRestaurantId());
        assertEquals("rest-999", existingUser.getRestaurantId());
        verify(userRepository).save(existingUser);
    }

    @Test
    void testRegisterUser_AsRestaurant_UserNotFoundThrowsException() {
        UserRegisterRequest request = new UserRegisterRequest();
        request.setName("Chef Luigi");
        request.setEmail("luigi@restaurant.com");
        request.setPassword("luigiPass");
        request.setRole("restaurant");

        when(passwordEncoder.encode("luigiPass")).thenReturn("encodedLuigiPass");
        when(userService.saveUser(any(UserDto.class))).thenAnswer(invocation -> {
            UserDto dto = invocation.getArgument(0);
            dto.setId("user-missing");
            return dto;
        });

        RestaurantDto mockRestaurant = new RestaurantDto();
        mockRestaurant.setId("rest-888");
        when(restaurantService.createDefaultRestaurantForUser(any(UserDto.class))).thenReturn(mockRestaurant);
        when(userRepository.findById("user-missing")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.registerUser(request));
    }

    @Test
    void testLogin_Success() {
        LoginRequest loginRequest = new LoginRequest("user@example.com", "secret123");

        User user = new User();
        user.setId("u-100");
        user.setName("Test User");
        user.setEmail("user@example.com");

        when(userRepository.findByEmailWithAddresses("user@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("user@example.com", true)).thenReturn("access-token-123");

        JwtResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("access-token-123", response.getToken());
        assertNotNull(response.getUser());
        assertEquals("user@example.com", response.getUser().getEmail());
        assertEquals("Test User", response.getUser().getName());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void testLogin_UserNotFoundThrowsException() {
        LoginRequest loginRequest = new LoginRequest("unknown@example.com", "secret123");

        when(userRepository.findByEmailWithAddresses("unknown@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.login(loginRequest));
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
