package com.foodtrip.controller.admin;

import com.foodtrip.service.admin.AdminService;
import com.foodtrip.service.food.FoodItemService;
import com.foodtrip.service.order.OrderService;
import com.foodtrip.service.restaurant.RestaurantService;
import com.foodtrip.service.user.UserService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.foodtrip.dto.common.ApiResponse;

import com.foodtrip.dto.admin.StatsResponse;
import com.foodtrip.dto.admin.RejectRestaurantRequest;
import com.foodtrip.dto.admin.UpdateDishStatusRequest;
import com.foodtrip.dto.admin.UpdateStatusRequest;

import com.foodtrip.dto.user.UserDto;
import com.foodtrip.dto.restaurant.RestaurantDto;
import com.foodtrip.dto.food.FoodItemDto;
import com.foodtrip.dto.order.OrderDto;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final RestaurantService restaurantService;
    private final OrderService orderService;
    private final FoodItemService foodItemService;
    private final AdminService adminService;

    public AdminController(UserService userService,
                           RestaurantService restaurantService,
                           OrderService orderService,
                           FoodItemService foodItemService,
                           AdminService adminService) {
        this.userService = userService;
        this.restaurantService = restaurantService;
        this.orderService = orderService;
        this.foodItemService = foodItemService;
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getUsers() {
        return ResponseEntity.ok(userService.getUsers());
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse> updateUserStatus(@PathVariable String id, @Valid @RequestBody UpdateStatusRequest body) {
        adminService.updateUserStatus(id, body.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Status updated"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable String id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted"));
    }

    @GetMapping("/restaurants")
    public ResponseEntity<List<RestaurantDto>> getRestaurants() {
        return ResponseEntity.ok(restaurantService.getRestaurants(PageRequest.of(0, 1000)).getContent());
    }

    @PatchMapping("/restaurants/{id}/status")
    public ResponseEntity<ApiResponse> updateRestaurantStatus(@PathVariable String id, @Valid @RequestBody UpdateStatusRequest body) {
        adminService.updateRestaurantStatus(id, body.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Status updated"));
    }

    @DeleteMapping("/restaurants/{id}")
    public ResponseEntity<ApiResponse> deleteRestaurant(@PathVariable String id) {
        adminService.deleteRestaurant(id);
        return ResponseEntity.ok(ApiResponse.success("Restaurant deleted"));
    }

    @GetMapping("/dishes")
    public ResponseEntity<List<FoodItemDto>> getDishes() {
        return ResponseEntity.ok(foodItemService.getAllFoods());
    }

    @PatchMapping("/dishes/{id}/status")
    public ResponseEntity<ApiResponse> updateDishStatus(@PathVariable String id, @Valid @RequestBody UpdateDishStatusRequest body) {
        adminService.updateDishStatus(id, body.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Status updated"));
    }

    @DeleteMapping("/dishes/{id}")
    public ResponseEntity<ApiResponse> deleteDish(@PathVariable String id) {
        adminService.deleteDish(id);
        return ResponseEntity.ok(ApiResponse.success("Dish deleted"));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDto>> getOrders() {
        return ResponseEntity.ok(orderService.getOrders());
    }

    @GetMapping("/restaurant-verifications")
    public ResponseEntity<List<RestaurantDto>> getPendingRestaurants() {
        return ResponseEntity.ok(restaurantService.getByStatus("PENDING"));
    }

    @GetMapping("/restaurant-verifications/{id}")
    public ResponseEntity<RestaurantDto> getRestaurantVerificationDetails(@PathVariable String id) {
        return ResponseEntity.ok(restaurantService.getRestaurant(id));
    }

    @PostMapping("/restaurant-verifications/{id}/approve")
    public ResponseEntity<ApiResponse> approveRestaurantVerification(@PathVariable String id) {
        adminService.approveRestaurantVerification(id);
        return ResponseEntity.ok(ApiResponse.success("Approved"));
    }

    @PostMapping("/restaurant-verifications/{id}/reject")
    public ResponseEntity<ApiResponse> rejectRestaurantVerification(@PathVariable String id, @Valid @RequestBody RejectRestaurantRequest body) {
        adminService.rejectRestaurantVerification(id, body.getReason());
        return ResponseEntity.ok(ApiResponse.success("Rejected"));
    }
}
