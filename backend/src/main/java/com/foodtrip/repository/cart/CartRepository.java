package com.foodtrip.repository.cart;

import com.foodtrip.entity.cart.Cart;
import com.foodtrip.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, String> {

    @Query("SELECT DISTINCT c FROM Cart c LEFT JOIN FETCH c.user LEFT JOIN FETCH c.items i LEFT JOIN FETCH i.foodItem fi LEFT JOIN FETCH fi.restaurant WHERE c.user = :user")
    Optional<Cart> findByUser(@Param("user") User user);

    @Query("SELECT DISTINCT c FROM Cart c LEFT JOIN FETCH c.user LEFT JOIN FETCH c.items i LEFT JOIN FETCH i.foodItem fi LEFT JOIN FETCH fi.restaurant WHERE c.user.id = :userId")
    Optional<Cart> findByUserId(@Param("userId") String userId);
}
