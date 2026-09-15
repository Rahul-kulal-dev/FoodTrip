package com.foodtrip.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AddressDto {
    private String id;
    private String fullName;
    private String phone;
    private String houseFlat;
    private String streetArea;
    private String city;
    private String state;
    private String pincode;
    private String addressType = "HOME";

    public String getAddressType() {
        return (addressType == null || addressType.trim().isEmpty()) ? "HOME" : addressType;
    }
}
