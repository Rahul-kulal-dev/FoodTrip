package com.foodtrip.dto.cart;

import com.foodtrip.dto.food.FoodItemDto;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CartItemDto {
    private String cartItemId;
    private FoodItemDto foodItem;
    private int quantity;
    private LocalDateTime createdDate;
}
