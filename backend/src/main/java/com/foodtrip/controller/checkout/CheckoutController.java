package com.foodtrip.controller.checkout;

import com.foodtrip.service.checkout.CheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.foodtrip.dto.checkout.CheckoutStatusResponse;

@RestController
@RequestMapping("/api/checkout")
@PreAuthorize("hasRole('CUSTOMER')")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @GetMapping
    public ResponseEntity<CheckoutStatusResponse> getCheckout() {
        return ResponseEntity.ok(checkoutService.getCheckoutData());
    }
}
