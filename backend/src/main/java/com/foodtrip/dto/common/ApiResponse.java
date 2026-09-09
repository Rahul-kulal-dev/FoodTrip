package com.foodtrip.dto.common;

import lombok.*;
import org.springframework.http.HttpStatus;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ApiResponse {
    private String message;
    private HttpStatus httpStatus;
    private boolean success;

    public static ApiResponse success(String message) {
        return ApiResponse.builder()
                .message(message)
                .httpStatus(HttpStatus.OK)
                .success(true)
                .build();
    }

    public static ApiResponse error(String message, HttpStatus httpStatus) {
        return ApiResponse.builder()
                .message(message)
                .httpStatus(httpStatus)
                .success(false)
                .build();
    }
}
