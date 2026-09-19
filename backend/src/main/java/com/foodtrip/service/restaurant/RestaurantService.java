package com.foodtrip.service.restaurant;

import com.foodtrip.dto.restaurant.RestaurantDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RestaurantService {
    RestaurantDto addRestaurant(RestaurantDto restaurant);

    RestaurantDto createDefaultRestaurantForUser(com.foodtrip.dto.user.UserDto userDto);

    RestaurantDto updateRestaurant(RestaurantDto restaurant, String restaurantId);

    void deleteRestaurant(String restaurantId);

    RestaurantDto getRestaurant(String restaurantId);

    Page<RestaurantDto> getRestaurants(Pageable pageable);

    Page<RestaurantDto> getApprovedRestaurants(String search, String cuisine, String status, String customSort, String sortBy, String sortDir, int page, int limit);

    List<RestaurantDto> getByOwner(String ownerId);

    List<RestaurantDto> searchByName(String nameKeyword);

    List<RestaurantDto> searchByAddress(String address);

    List<RestaurantDto> getByIsActive(Boolean isActive);

    List<RestaurantDto> getByOpen(Boolean isOpen);

    List<RestaurantDto> getByIsActiveAndOpen(Boolean isActive, Boolean isOpen);

    List<RestaurantDto> getByStatus(String status);
    default List<RestaurantDto> getByVerificationStatus(String status) {
        return getByStatus(status);
    }

    RestaurantDto submitVerification(String restaurantId, com.foodtrip.dto.restaurant.SubmitVerificationRequest payload);

}
