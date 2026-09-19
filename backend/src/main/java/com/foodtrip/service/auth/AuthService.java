package com.foodtrip.service.auth;

import com.foodtrip.dto.auth.JwtResponse;
import com.foodtrip.dto.auth.LoginRequest;
import com.foodtrip.dto.auth.UserRegisterRequest;
import com.foodtrip.dto.user.UserDto;

public interface AuthService {
    JwtResponse registerUser(UserRegisterRequest userRegisterData);
    JwtResponse login(LoginRequest loginRequest);
    UserDto getMe();
    UserDto updateMe(java.util.Map<String, Object> updateRequest);
    String getLoggedInUserId();
    String getLoggedInUserRestaurantId();
    boolean isAdmin();
}
