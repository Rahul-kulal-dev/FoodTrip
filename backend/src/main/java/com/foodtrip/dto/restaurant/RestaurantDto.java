package com.foodtrip.dto.restaurant;

import com.foodtrip.dto.user.UserDto;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class RestaurantDto {

    private String id;
    private String code;

    @NotBlank(message = "Restaurant name is mandatory")
    private String name;

    private String description;

    private UserDto ownerUser;
    private String owner;
    private String email;
    private String phone;
    private String logoImage;
    private String coverImage;
    private com.foodtrip.entity.restaurant.CuisineType cuisine;

    private String address;
    private String city;
    private String state;
    private String pincode;
    private String location;

    private String openingTime;
    private String closingTime;

    private List<String> workingDays = new ArrayList<>();

    private Boolean isActive = true;
    private Boolean isOpen = true;
    private String status;
    private String rejectionReason;

    private String fssaiLicenseNo;
    private String fssaiDocUrl;

    private Double rating;

    private Boolean isOpenNow;

    public String getLogo() {
        return logoImage;
    }

    public void setLogo(String logo) {
        this.logoImage = logo;
    }

    public String getBannerImage() {
        return coverImage;
    }

    public void setBannerImage(String bannerImage) {
        this.coverImage = bannerImage;
    }

    public String getImage() {
        return coverImage;
    }

    public void setImage(String image) {
        this.coverImage = image;
    }

    private LocalDateTime createdDate;

    public LocalDateTime getCreatedAt() {
        return createdDate;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdDate = createdAt;
    }
}

