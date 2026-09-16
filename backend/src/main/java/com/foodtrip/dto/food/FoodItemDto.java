package com.foodtrip.dto.food;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FoodItemDto {
    private String id;

    @NotBlank(message = "Food item name is mandatory")
    private String name;
    private String description;
    private double price;

    @JsonProperty("isAvailable")
    private boolean available;

    @JsonProperty("isVeg")
    private boolean veg;

    private String category;
    private Double rating;

    @JsonProperty("image")
    private String image;

    private String restaurantId;
    private String restaurantName;

    public String getImageUrl() {
        return image;
    }

    public void setImageUrl(String imageUrl) {
        this.image = imageUrl;
    }
}
