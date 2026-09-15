package com.foodtrip.dto.user;

import com.foodtrip.entity.user.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String id;
    private String name;
    private String email;
    private String password;
    private String phone;
    private Role role;
    private String status;
    private String verificationStatus;
    private String restaurantId;

    private LocalDate createdDate;
    private boolean enabled;
    private List<AddressDto> addresses = new ArrayList<>();
}
