package com.foodtrip.repository.order;

import com.foodtrip.entity.order.Order;
import com.foodtrip.entity.order.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {

    @Query("SELECT oi FROM OrderItem oi LEFT JOIN FETCH oi.foodItem fi LEFT JOIN FETCH fi.restaurant WHERE oi.order = :order")
    List<OrderItem> findByOrder(@Param("order") Order order);

    @Query("SELECT oi FROM OrderItem oi LEFT JOIN FETCH oi.foodItem fi LEFT JOIN FETCH fi.restaurant LEFT JOIN FETCH oi.order WHERE oi.id = :id")
    Optional<OrderItem> findByIdWithDetails(@Param("id") String id);

}
