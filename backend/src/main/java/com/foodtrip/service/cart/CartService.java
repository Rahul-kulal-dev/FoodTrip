package com.foodtrip.service.cart;

import com.foodtrip.dto.cart.AddItemToCartRequest;
import com.foodtrip.dto.cart.CartDto;
import com.foodtrip.dto.cart.SyncCartRequest;
import com.foodtrip.dto.cart.UpdateCartItemRequest;

public interface CartService {

    CartDto getCart(String userId);

    CartDto addItemToCart(AddItemToCartRequest addItemToCartRequest);

    CartDto updateItemQuantity(String userId, String foodItemId, UpdateCartItemRequest updateRequest);

    CartDto removeItem(String userId, String foodItemId);

    CartDto syncCart(String userId, SyncCartRequest syncCartRequest);

    void clearCart(String userId);
}
