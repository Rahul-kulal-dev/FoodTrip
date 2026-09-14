package com.foodtrip.repository.order;

import com.foodtrip.entity.order.OrderDeliveryAddress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderDeliveryAddressRepository extends JpaRepository<OrderDeliveryAddress, String> {
}
