package com.foodtrip.dto.cart;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AddItemToCartRequest {

    @NotBlank(message = "Food item ID is required")
    @com.fasterxml.jackson.annotation.JsonProperty("foodItemId")
    private String productId;
    private String userId;
    private int quantity;

}
