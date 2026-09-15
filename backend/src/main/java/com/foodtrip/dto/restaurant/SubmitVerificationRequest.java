package com.foodtrip.dto.restaurant;

public record SubmitVerificationRequest(
    String restaurantName,
    String phone,
    String restaurantAddress,
    String licenseNo,
    String fssaiDocUrl,
    DocumentInfo documentInfo
) {
    public record DocumentInfo(String fssaiDocUrl) {}
}
