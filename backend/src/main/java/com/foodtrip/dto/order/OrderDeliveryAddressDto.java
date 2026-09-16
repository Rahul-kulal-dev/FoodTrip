package com.foodtrip.dto.order;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class OrderDeliveryAddressDto {
    private String id;
    private String fullName;
    private String phone;
    private String houseFlat;
    private String streetArea;
    private String city;
    private String state;
    private String pincode;
    private String addressType;
}
