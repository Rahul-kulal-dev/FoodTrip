package com.foodtrip.repository.food;

import com.foodtrip.entity.food.FoodItem;
import com.foodtrip.entity.restaurant.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FoodItemRepository extends JpaRepository<FoodItem, String> {

    @Query("SELECT f FROM FoodItem f LEFT JOIN FETCH f.restaurant")
    List<FoodItem> findAllWithRestaurant();

    @Query("SELECT f FROM FoodItem f LEFT JOIN FETCH f.restaurant WHERE f.restaurant = :restaurant")
    List<FoodItem> findByRestaurant(@Param("restaurant") Restaurant restaurant);

    @Query("SELECT f FROM FoodItem f LEFT JOIN FETCH f.restaurant WHERE f.restaurant.id = :restaurantId")
    List<FoodItem> findByRestaurantId(@Param("restaurantId") String restaurantId);

    @Query("SELECT DISTINCT f FROM FoodItem f LEFT JOIN FETCH f.restaurant r LEFT JOIN FETCH r.workingDays WHERE f.id = :id")
    Optional<FoodItem> findByIdWithRestaurant(@Param("id") String id);

    @Query("SELECT DISTINCT f FROM FoodItem f LEFT JOIN FETCH f.restaurant r LEFT JOIN FETCH r.workingDays WHERE f IN :foodItems")
    List<FoodItem> fetchRestaurantDetailsForFoodItems(@Param("foodItems") List<FoodItem> foodItems);
}
