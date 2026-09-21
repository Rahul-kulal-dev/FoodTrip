package com.foodtrip.controller.auth;

import com.foodtrip.dto.auth.*;
import com.foodtrip.dto.user.UserDto;
import com.foodtrip.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<JwtResponse> registerUser(@Valid @RequestBody UserRegisterRequest userRegisterData) {
        JwtResponse response = authService.registerUser(userRegisterData);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'RESTAURANT', 'ADMIN')")
    public ResponseEntity<UserDto> getMe() {
        UserDto userDto = authService.getMe();
        if (userDto != null) {
            return ResponseEntity.ok(userDto);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'RESTAURANT', 'ADMIN')")
    public ResponseEntity<UserDto> updateMe(@RequestBody java.util.Map<String, Object> updateRequest) {
        UserDto userDto = authService.updateMe(updateRequest);
        if (userDto != null) {
            return ResponseEntity.ok(userDto);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
