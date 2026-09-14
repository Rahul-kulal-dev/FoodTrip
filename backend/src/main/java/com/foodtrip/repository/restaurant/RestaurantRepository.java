package com.foodtrip.repository.restaurant;

import com.foodtrip.entity.restaurant.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, String>, JpaSpecificationExecutor<Restaurant> {

    @Query("SELECT DISTINCT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH r.workingDays WHERE r.id = :id")
    Optional<Restaurant> findByIdWithDetails(@Param("id") String id);

    @Query("SELECT DISTINCT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH r.workingDays")
    List<Restaurant> findAllWithDetails();

    @Query(value = "SELECT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser", countQuery = "SELECT COUNT(r) FROM Restaurant r")
    Page<Restaurant> findAllWithOwnersPaginated(Pageable pageable);

    @Query("SELECT DISTINCT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH r.workingDays WHERE r IN :restaurants")
    List<Restaurant> fetchDetailsForRestaurants(@Param("restaurants") List<Restaurant> restaurants);

    @Query("SELECT DISTINCT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH r.workingDays WHERE r.ownerUser.id = :ownerId")
    List<Restaurant> findByOwnerId(@Param("ownerId") String ownerId);

    @Query("SELECT DISTINCT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH r.workingDays WHERE LOWER(r.name) LIKE LOWER(CONCAT('%', :nameKeyword, '%'))")
    List<Restaurant> searchByName(@Param("nameKeyword") String nameKeyword);

    @Query("SELECT DISTINCT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH r.workingDays WHERE LOWER(r.address) LIKE LOWER(CONCAT('%', :address, '%')) OR LOWER(r.city) LIKE LOWER(CONCAT('%', :address, '%')) OR LOWER(r.state) LIKE LOWER(CONCAT('%', :address, '%'))")
    List<Restaurant> searchByAddress(@Param("address") String address);

    @Query("SELECT DISTINCT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH r.workingDays WHERE UPPER(r.status) = UPPER(:status)")
    List<Restaurant> findByStatus(@Param("status") String status);

    @Query("SELECT DISTINCT r FROM Restaurant r LEFT JOIN FETCH r.ownerUser LEFT JOIN FETCH r.workingDays WHERE r.isActive = :isActive")
    List<Restaurant> findByIsActive(@Param("isActive") boolean isActive);
}
