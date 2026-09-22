package com.foodtrip.controller.order;

import com.foodtrip.dto.order.OrderDto;
import com.foodtrip.dto.order.PlaceOrderRequest;
import com.foodtrip.service.auth.AuthService;
import com.foodtrip.service.order.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.foodtrip.dto.common.PagedResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.foodtrip.dto.admin.UpdateStatusRequest;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    public OrderController(OrderService orderService, AuthService authService) {
        this.orderService = orderService;
        this.authService = authService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderDto> placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        OrderDto orderDto = orderService.placeOrder(request, authService.getLoggedInUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(orderDto);
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<PagedResponse<OrderDto>> getAllOrders(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "7") int limit) {
        int pageIndex = Math.max(0, page - 1);
        Pageable pageable = PageRequest.of(pageIndex, limit, Sort.by("orderedAt").descending());
        Page<OrderDto> pagedResult = orderService.getOrderByUser(authService.getLoggedInUserId(), pageable);
        int totalPages = pagedResult.getTotalPages() == 0 ? 1 : pagedResult.getTotalPages();
        return ResponseEntity.ok(
                new PagedResponse<>(
                        true,
                        pagedResult.getContent(),
                        page,
                        limit,
                        pagedResult.getTotalElements(),
                        totalPages
                )
        );
    }

    @GetMapping("/mine/restaurant")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<List<OrderDto>> getMyRestaurantOrders() {
        String restaurantId = authService.getLoggedInUserRestaurantId();
        List<OrderDto> orders = orderService.getOrderByRestaurant(restaurantId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}/track")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderDto> trackOrder(@PathVariable String orderId) {
        OrderDto orderDto = orderService.trackOrder(orderId);
        if (!orderDto.getUser().getId().equals(authService.getLoggedInUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied");
        }
        return ResponseEntity.ok(orderDto);
    }

    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<OrderDto> cancelOrder(@PathVariable String orderId) {
        OrderDto orderDto = orderService.trackOrder(orderId);
        if (!orderDto.getUser().getId().equals(authService.getLoggedInUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied");
        }
        OrderDto cancelled = orderService.cancelOrder(orderId);
        return ResponseEntity.ok(cancelled);
    }

    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT')")
    public ResponseEntity<OrderDto> updateOrder(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        if (!authService.isAdmin()) {
            OrderDto orderDto = orderService.trackOrder(orderId);
            String restaurantId = orderDto.getRestaurant() != null ? orderDto.getRestaurant().getId() : null;
            if (restaurantId == null || !restaurantId.equals(authService.getLoggedInUserRestaurantId())) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied");
            }
        }
        OrderDto orderDto = orderService.updateOrderStatus(orderId, request.getStatus());
        return ResponseEntity.ok(orderDto);
    }
}
