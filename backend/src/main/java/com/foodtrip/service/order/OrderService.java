package com.foodtrip.service.order;

import com.foodtrip.dto.order.OrderDto;
import com.foodtrip.dto.order.PlaceOrderRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderService {

    OrderDto placeOrder(PlaceOrderRequest request, String userId);

    List<OrderDto> getOrders();

    List<OrderDto> getOrderByRestaurant(String restaurantId);

    List<OrderDto> getOrderByUser(String userId);

    Page<OrderDto> getOrderByUser(String userId, Pageable pageable);

    OrderDto trackOrder(String orderId);

    OrderDto cancelOrder(String orderId);

    OrderDto updateOrderStatus(String orderId, String orderStatus);

}
