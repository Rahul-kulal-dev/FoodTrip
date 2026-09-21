package com.foodtrip.controller.restaurant;

import com.foodtrip.dto.restaurant.RestaurantDto;
import com.foodtrip.dto.food.FoodItemDto;
import com.foodtrip.service.auth.AuthService;
import com.foodtrip.service.restaurant.RestaurantService;
import com.foodtrip.service.food.FoodItemService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.foodtrip.dto.common.PagedResponse;
import com.foodtrip.dto.restaurant.SubmitVerificationRequest;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final FoodItemService foodItemService;
    private final AuthService authService;

    public RestaurantController(RestaurantService restaurantService, FoodItemService foodItemService, AuthService authService) {
        this.restaurantService = restaurantService;
        this.foodItemService = foodItemService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<RestaurantDto>> restaurants(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "10") int limit,
            @RequestParam(value = "sortBy", required = false, defaultValue = "name") String sortBy,
            @RequestParam(value = "sortDir", required = false, defaultValue = "desc") String sortDir,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "cuisine", required = false) String cuisine,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "sort", required = false) String customSort) {

        Page<RestaurantDto> pagedResult = restaurantService.getApprovedRestaurants(
                search, cuisine, status, customSort, sortBy, sortDir, page, limit
        );

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

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantDto> getRestaurant(@PathVariable String id) {
        return ResponseEntity.ok(restaurantService.getRestaurant(id));
    }

    @GetMapping("/{id}/menu")
    public ResponseEntity<List<FoodItemDto>> getMenu(@PathVariable String id) {
        return ResponseEntity.ok(foodItemService.getFoodsByRestaurant(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RestaurantDto> addRestaurant(@Valid @RequestBody RestaurantDto restaurantDto) {
        RestaurantDto createdRestaurant = restaurantService.addRestaurant(restaurantDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRestaurant);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT')")
    public ResponseEntity<RestaurantDto> updateRestaurant(@Valid @RequestBody RestaurantDto restaurantDto,
                                                          @PathVariable String id) {
        if (!authService.isAdmin()) {
            String myRestaurantId = authService.getLoggedInUserRestaurantId();
            if (myRestaurantId == null || !myRestaurantId.equals(id)) {
                throw new org.springframework.security.access.AccessDeniedException("Access denied");
            }
        }
        RestaurantDto updatedRestaurant = restaurantService.updateRestaurant(restaurantDto, id);
        return ResponseEntity.ok(updatedRestaurant);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable String id) {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<RestaurantDto> getMyRestaurant() {
        String restaurantId = authService.getLoggedInUserRestaurantId();
        return ResponseEntity.ok(restaurantService.getRestaurant(restaurantId));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<RestaurantDto> updateMyRestaurant(@Valid @RequestBody RestaurantDto restaurantDto) {
        String restaurantId = authService.getLoggedInUserRestaurantId();
        RestaurantDto updatedRestaurant = restaurantService.updateRestaurant(restaurantDto, restaurantId);
        return ResponseEntity.ok(updatedRestaurant);
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<Void> deleteMyRestaurant() {
        String restaurantId = authService.getLoggedInUserRestaurantId();
        restaurantService.deleteRestaurant(restaurantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/verification")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<RestaurantDto> getVerification() {
        String restaurantId = authService.getLoggedInUserRestaurantId();
        return ResponseEntity.ok(restaurantService.getRestaurant(restaurantId));
    }

    @PostMapping("/verification")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<RestaurantDto> submitVerification(@Valid @RequestBody SubmitVerificationRequest payload) {
        String restaurantId = authService.getLoggedInUserRestaurantId();
        RestaurantDto updated = restaurantService.submitVerification(restaurantId, payload);
        return ResponseEntity.ok(updated);
    }
}
