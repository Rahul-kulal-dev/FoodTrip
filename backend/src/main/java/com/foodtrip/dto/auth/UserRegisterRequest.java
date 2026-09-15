package com.foodtrip.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserRegisterRequest {

    @NotBlank(message = "user name is required")
    private String name;
    @Email(message = "valid email is required")
    private String email;

    @NotBlank(message = "password is required")
    @Size(min = 3, max = 100, message = "min=3 and max= 100 bound required")
    private String password;
    private String confirmPassword;
    private String role;

}
