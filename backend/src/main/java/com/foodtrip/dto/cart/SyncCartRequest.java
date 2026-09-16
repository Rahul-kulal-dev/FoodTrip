package com.foodtrip.dto.cart;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SyncCartRequest {

    private List<SyncCartItemRequest> items;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class SyncCartItemRequest {
        @JsonAlias({"id", "productId"})
        private String foodItemId;
        private int quantity;
    }
}
