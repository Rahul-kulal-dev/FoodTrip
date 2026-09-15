package com.foodtrip.dto.auth;

import com.foodtrip.dto.user.UserDto;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JwtResponse {

    private String token;
    private UserDto user;
}
