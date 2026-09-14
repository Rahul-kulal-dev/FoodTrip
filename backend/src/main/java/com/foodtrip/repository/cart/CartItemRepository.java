package com.foodtrip.repository.cart;

import com.foodtrip.entity.cart.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartItemRepository extends JpaRepository<CartItem, String> {

    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.foodItem.id = :foodItemId")
    void deleteByFoodItemId(@Param("foodItemId") String foodItemId);
}
