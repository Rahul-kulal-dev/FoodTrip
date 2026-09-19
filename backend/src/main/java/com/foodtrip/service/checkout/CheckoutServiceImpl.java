package com.foodtrip.service.checkout;

import org.springframework.stereotype.Service;

import com.foodtrip.dto.checkout.CheckoutStatusResponse;

@Service
public class CheckoutServiceImpl implements CheckoutService {

    @Override
    public CheckoutStatusResponse getCheckoutData() {
        return new CheckoutStatusResponse("ready");
    }
}
