package com.foodtrip.controller.food;

import com.foodtrip.dto.food.FoodItemDto;
import com.foodtrip.service.auth.AuthService;
import com.foodtrip.service.food.FoodItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.foodtrip.dto.common.DataResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/dishes")
public class FoodItemController {

    private final FoodItemService foodItemService;
    private final AuthService authService;

    public FoodItemController(FoodItemService foodItemService, AuthService authService) {
        this.foodItemService = foodItemService;
        this.authService = authService;
    }

    @PostMapping
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<FoodItemDto> addFood(@Valid @RequestBody FoodItemDto foodItemDto) {
        if (foodItemDto.getRestaurantId() == null || foodItemDto.getRestaurantId().trim().isEmpty()) {
            foodItemDto.setRestaurantId(authService.getLoggedInUserRestaurantId());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(foodItemService.addFood(foodItemDto));
    }

    @PutMapping("/{foodId}")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<FoodItemDto> updateFood(@PathVariable String foodId, @Valid @RequestBody FoodItemDto foodItemDto) {
        String myRestaurantId = authService.getLoggedInUserRestaurantId();
        FoodItemDto existing = foodItemService.getFoodById(foodId);
        if (myRestaurantId == null || !myRestaurantId.equals(existing.getRestaurantId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied");
        }
        foodItemDto.setRestaurantId(myRestaurantId);
        return ResponseEntity.ok(foodItemService.updateFood(foodId, foodItemDto));
    }

    @DeleteMapping("/{foodId}")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<Void> deleteFood(@PathVariable String foodId) {
        String myRestaurantId = authService.getLoggedInUserRestaurantId();
        FoodItemDto existing = foodItemService.getFoodById(foodId);
        if (myRestaurantId == null || !myRestaurantId.equals(existing.getRestaurantId())) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied");
        }
        foodItemService.deleteFood(foodId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<DataResponse<List<FoodItemDto>>> getAllFoods() {
        return ResponseEntity.ok(new DataResponse<>(true, foodItemService.getAllFoods()));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<List<FoodItemDto>> getMyDishes() {
        String restaurantId = authService.getLoggedInUserRestaurantId();
        if (restaurantId == null || restaurantId.trim().isEmpty()) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(foodItemService.getAllFoodsByRestaurant(restaurantId));
    }

    @GetMapping("/{foodId}")
    public ResponseEntity<FoodItemDto> getFoodById(@PathVariable String foodId) {
        return ResponseEntity.ok(foodItemService.getFoodById(foodId));
    }
}
