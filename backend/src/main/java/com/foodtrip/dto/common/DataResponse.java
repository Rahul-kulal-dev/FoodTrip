package com.foodtrip.dto.common;

public record DataResponse<T>(boolean success, T data) {}
