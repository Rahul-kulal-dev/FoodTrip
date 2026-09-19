package com.foodtrip.service.food;

import com.foodtrip.dto.food.FoodItemDto;
import java.util.List;

public interface FoodItemService {
    FoodItemDto addFood(FoodItemDto foodItemDto);

    FoodItemDto updateFood(String foodId, FoodItemDto foodItemDto);

    void deleteFood(String foodId);

    List<FoodItemDto> getAllFoods();

    List<FoodItemDto> getFoodsByRestaurant(String restaurantId);

    List<FoodItemDto> getAllFoodsByRestaurant(String restaurantId);

    FoodItemDto getFoodById(String foodId);
}
