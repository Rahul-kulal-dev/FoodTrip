package com.foodtrip.service.user;

import com.foodtrip.dto.user.UserDto;

import java.util.List;

public interface UserService {

    UserDto saveUser(UserDto user);
    UserDto updateUser(UserDto user, String userId);

    void deleteUser(String userId);
    UserDto getUser(String userId);
    UserDto getUserByEmail(String email);
    List<UserDto> getUsers();
    List<UserDto> searchUserName(String keyword);

}
