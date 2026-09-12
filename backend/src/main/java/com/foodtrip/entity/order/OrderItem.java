package com.foodtrip.entity.order;

import com.foodtrip.entity.food.FoodItem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id")
    private FoodItem foodItem;

    private String name;
    private double price;
    private int quantity;

    private boolean isVeg = true;
    private String image;

    public double getActualPriceOfOrderItem() {
        return quantity * price;
    }

}
