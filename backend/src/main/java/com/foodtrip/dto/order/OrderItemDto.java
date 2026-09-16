package com.foodtrip.dto.order;

import com.foodtrip.dto.food.FoodItemDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemDto {
    private String id;
    private String itemId;
    private String name;
    private double price;
    private int quantity;
    private boolean isVeg;
    private String image;

    private FoodItemDto foodItem;

    public double getActualPriceOfOrderItem() {
        return quantity * price;
    }
}
