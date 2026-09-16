package com.foodtrip.dto.cart;

import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CartDto {
    private String cartId;
    private String userId;
    private List<CartItemDto> items;
}
