package com.foodtrip.controller.cart;

import com.foodtrip.dto.cart.AddItemToCartRequest;
import com.foodtrip.dto.cart.CartDto;
import com.foodtrip.service.auth.AuthService;
import com.foodtrip.service.cart.CartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.foodtrip.dto.common.ApiResponse;
import com.foodtrip.dto.cart.SyncCartRequest;
import com.foodtrip.dto.cart.UpdateCartItemRequest;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    private final CartService cartService;
    private final AuthService authService;

    public CartController(CartService cartService, AuthService authService) {
        this.cartService = cartService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<CartDto> getCart() {
        CartDto cart = cartService.getCart(authService.getLoggedInUserId());
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<CartDto> addItemToCart(@Valid @RequestBody AddItemToCartRequest request) {
        request.setUserId(authService.getLoggedInUserId());
        CartDto cart = cartService.addItemToCart(request);
        return new ResponseEntity<>(cart, HttpStatus.CREATED);
    }

    @PatchMapping("/items/{foodItemId}")
    public ResponseEntity<CartDto> updateCartItemQuantity(
            @PathVariable String foodItemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartDto cart = cartService.updateItemQuantity(authService.getLoggedInUserId(), foodItemId, request);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/items/{foodItemId}")
    public ResponseEntity<CartDto> removeCartItem(@PathVariable String foodItemId) {
        CartDto cart = cartService.removeItem(authService.getLoggedInUserId(), foodItemId);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse> clearCart() {
        cartService.clearCart(authService.getLoggedInUserId());
        return ResponseEntity.ok(ApiResponse.success("Cart is cleared"));
    }

    @PostMapping("/sync")
    public ResponseEntity<CartDto> syncCart(@RequestBody SyncCartRequest request) {
        CartDto cart = cartService.syncCart(authService.getLoggedInUserId(), request);
        return ResponseEntity.ok(cart);
    }
}
