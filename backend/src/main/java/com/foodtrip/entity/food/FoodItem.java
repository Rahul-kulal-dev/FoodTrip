package com.foodtrip.entity.food;

import com.foodtrip.entity.restaurant.Restaurant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    @Lob
    private String description;

    private double price;

    private boolean isAvailable = true;
    private boolean isVeg = true;

    private String category;

    private Double rating = 4.5;

    private String imageUrl = "";

    private LocalDateTime createdDate;

    @ManyToOne(fetch = FetchType.LAZY)
    private Restaurant restaurant;

    private String restaurantName = "";

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    public double actualPrice() {
        return price;
    }
}
