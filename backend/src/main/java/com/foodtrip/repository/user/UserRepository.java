package com.foodtrip.repository.user;

import com.foodtrip.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.addresses")
    List<User> findAllWithAddresses();

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.addresses WHERE u.email = :email")
    Optional<User> findByEmailWithAddresses(@Param("email") String email);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.addresses WHERE u.id = :id")
    Optional<User> findByIdWithAddresses(@Param("id") String id);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.addresses WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchByNameWithAddresses(@Param("keyword") String keyword);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
