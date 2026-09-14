package com.foodtrip.repository.order;

import com.foodtrip.entity.order.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, String> {

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH o.deliveryAddress LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.foodItem fi LEFT JOIN FETCH fi.restaurant ORDER BY o.orderedAt DESC")
    List<Order> findAllWithDetails();

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH o.deliveryAddress LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.foodItem fi LEFT JOIN FETCH fi.restaurant WHERE o.restaurant.id = :restaurantId ORDER BY o.orderedAt DESC")
    List<Order> findByRestaurantId(@Param("restaurantId") String restaurantId);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH o.deliveryAddress LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.foodItem fi LEFT JOIN FETCH fi.restaurant WHERE o.user.id = :userId ORDER BY o.orderedAt DESC")
    List<Order> findByUserId(@Param("userId") String userId);

    @Query(value = "SELECT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH o.deliveryAddress WHERE o.user.id = :userId", countQuery = "SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId")
    Page<Order> findByUserIdPaginated(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.foodItem fi LEFT JOIN FETCH fi.restaurant WHERE o IN :orders")
    List<Order> fetchOrderItems(@Param("orders") List<Order> orders);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH o.deliveryAddress LEFT JOIN FETCH o.orderItems oi LEFT JOIN FETCH oi.foodItem fi LEFT JOIN FETCH fi.restaurant WHERE o.id = :orderId")
    Optional<Order> findByIdWithDetails(@Param("orderId") String orderId);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o")
    Double sumTotalRevenue();
}
