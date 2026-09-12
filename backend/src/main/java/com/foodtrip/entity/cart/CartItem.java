package com.foodtrip.entity.cart;

import com.foodtrip.entity.food.FoodItem;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cart_item", uniqueConstraints = {
    @UniqueConstraint(name = "uk_cart_food_item", columnNames = {"cart_id", "food_item_id"})
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CartItem {

    @Id
    private String cartItemId;

    @JoinColumn(name = "cart_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private Cart cart;

    @JoinColumn(name = "food_item_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private FoodItem foodItem;

    private int quantity;

    @Column(name = "created_date")
    private java.time.LocalDateTime createdDate;

    @PrePersist
    public void prePersist() {
        if (this.createdDate == null) {
            this.createdDate = java.time.LocalDateTime.now();
        }
    }
}
