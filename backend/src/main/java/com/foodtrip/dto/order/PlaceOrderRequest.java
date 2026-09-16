package com.foodtrip.dto.order;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlaceOrderRequest {
    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    private String addressId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    private String idempotencyKey;
}
