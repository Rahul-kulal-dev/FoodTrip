package com.foodtrip.dto.order;

import com.foodtrip.dto.restaurant.RestaurantDto;
import com.foodtrip.dto.user.UserDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderDto {
    private String id;
    private String orderNumber;
    private UserDto user;
    private RestaurantDto restaurant;
    private OrderDeliveryAddressDto deliveryAddress;

    private double totalAmount;

    private String orderStatus;
    private LocalDateTime orderedAt;
    private List<OrderItemDto> items = new ArrayList<>();
    private List<OrderItemDto> orderItems = new ArrayList<>();

    private String paymentMethod;
}
