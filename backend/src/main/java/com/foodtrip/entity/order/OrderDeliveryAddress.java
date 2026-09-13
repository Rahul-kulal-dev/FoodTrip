package com.foodtrip.entity.order;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "order_delivery_address")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderDeliveryAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String fullName = "";
    private String phone = "";
    private String houseFlat = "";
    private String streetArea = "";
    private String city = "";
    private String state = "";
    private String pincode = "";
    private String addressType = "HOME";

    @OneToOne(mappedBy = "deliveryAddress", fetch = FetchType.LAZY)
    private Order order;
}
