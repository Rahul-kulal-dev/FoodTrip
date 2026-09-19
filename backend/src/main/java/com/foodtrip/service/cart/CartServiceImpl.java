package com.foodtrip.service.cart;

import com.foodtrip.dto.cart.AddItemToCartRequest;
import com.foodtrip.dto.cart.CartDto;
import com.foodtrip.dto.cart.CartItemDto;
import com.foodtrip.entity.cart.Cart;
import com.foodtrip.entity.cart.CartItem;
import com.foodtrip.entity.food.FoodItem;
import com.foodtrip.entity.user.User;
import com.foodtrip.exception.ResourceNotFoundException;
import com.foodtrip.repository.cart.CartRepository;
import com.foodtrip.repository.food.FoodItemRepository;
import com.foodtrip.repository.user.UserRepository;
import com.foodtrip.service.s3.S3Service;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

import com.foodtrip.dto.cart.SyncCartRequest;

import com.foodtrip.dto.cart.UpdateCartItemRequest;

@Service
@Transactional
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;
    private final ModelMapper mapper;
    private final S3Service s3Service;

    public CartServiceImpl(CartRepository cartRepository,
                           FoodItemRepository foodItemRepository,
                           UserRepository userRepository,
                           ModelMapper mapper,
                           S3Service s3Service) {
        this.cartRepository = cartRepository;
        this.foodItemRepository = foodItemRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
        this.s3Service = s3Service;
    }

    @Override
    public CartDto getCart(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(createCart(user)));

        return convertToDto(cart);
    }

    @Override
    public CartDto addItemToCart(AddItemToCartRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(request.getUserId())
                .orElseGet(() -> cartRepository.save(createCart(user)));

        FoodItem foodItem = foodItemRepository.findByIdWithRestaurant(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Food item not found"));

        validateFoodItem(foodItem);
        validateRestaurant(cart, foodItem);

        int quantity = request.getQuantity() > 0 ? request.getQuantity() : 1;
        addOrUpdateCartItem(cart, foodItem, quantity);

        return convertToDto(cartRepository.save(cart));
    }

    @Override
    public CartDto updateItemQuantity(String userId, String foodItemId, UpdateCartItemRequest updateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(createCart(user)));

        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getFoodItem().getId().equals(foodItemId))
                .findFirst()
                .orElse(null);

        if (updateRequest == null || updateRequest.getQuantity() == null) {
            throw new IllegalArgumentException("Quantity must be provided");
        }
        int targetQuantity = updateRequest.getQuantity();

        if (targetQuantity <= 0) {
            if (existingItem != null) {
                cart.getItems().remove(existingItem);
            }
        } else {
            if (existingItem != null) {
                existingItem.setQuantity(targetQuantity);
            } else {
                FoodItem foodItem = foodItemRepository.findByIdWithRestaurant(foodItemId)
                        .orElseThrow(() -> new ResourceNotFoundException("Food item not found with id: " + foodItemId));
                validateFoodItem(foodItem);
                validateRestaurant(cart, foodItem);
                CartItem newItem = CartItem.builder()
                        .cartItemId(UUID.randomUUID().toString())
                        .cart(cart)
                        .foodItem(foodItem)
                        .quantity(targetQuantity)
                        .createdDate(java.time.LocalDateTime.now())
                        .build();
                cart.getItems().add(newItem);
            }
        }

        return convertToDto(cartRepository.save(cart));
    }

    @Override
    public CartDto removeItem(String userId, String foodItemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found"));

        cart.getItems().removeIf(item -> item.getFoodItem().getId().equals(foodItemId));

        return convertToDto(cartRepository.save(cart));
    }

    @Override
    public CartDto syncCart(String userId, SyncCartRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(createCart(user)));

        cart.getItems().clear();
        cartRepository.flush();

        if (request != null && request.getItems() != null) {
            for (SyncCartRequest.SyncCartItemRequest itemReq : request.getItems()) {
                if (itemReq.getFoodItemId() == null || itemReq.getFoodItemId().trim().isEmpty()) {
                    continue;
                }
                FoodItem foodItem = foodItemRepository.findByIdWithRestaurant(itemReq.getFoodItemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Food item not found with id: " + itemReq.getFoodItemId()));

                validateFoodItem(foodItem);
                validateRestaurant(cart, foodItem);

                int quantity = itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1;
                addOrUpdateCartItem(cart, foodItem, quantity);
            }
        }

        return convertToDto(cartRepository.save(cart));
    }

    @Override
    public void clearCart(String userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
        });
    }

    private Cart createCart(User user) {
        return Cart.builder()
                .cartId(UUID.randomUUID().toString())
                .user(user)
                .items(new ArrayList<>())
                .build();
    }

    private void validateFoodItem(FoodItem foodItem) {
        if (!foodItem.isAvailable()) {
            throw new IllegalArgumentException("Food item is not available");
        }
        if (!foodItem.getRestaurant().isOpenNow()) {
            throw new IllegalArgumentException("Restaurant is currently closed");
        }
    }

    private void validateRestaurant(Cart cart, FoodItem foodItem) {
        String restaurantId = foodItem.getRestaurant().getId();
        boolean differentRestaurant = cart.getItems().stream()
                .anyMatch(item -> !item.getFoodItem().getRestaurant().getId().equals(restaurantId));

        if (differentRestaurant) {
            throw new IllegalArgumentException("Food item is from a different restaurant. Please clear the cart before adding it.");
        }
    }

    private void addOrUpdateCartItem(Cart cart, FoodItem foodItem, int quantity) {
        CartItem existingItem = cart.getItems().stream()
                .filter(item -> item.getFoodItem().getId().equals(foodItem.getId()))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
            return;
        }

        CartItem cartItem = CartItem.builder()
                .cartItemId(UUID.randomUUID().toString())
                .cart(cart)
                .foodItem(foodItem)
                .quantity(quantity)
                .createdDate(java.time.LocalDateTime.now())
                .build();

        cart.getItems().add(cartItem);
    }

    private CartDto convertToDto(Cart cart) {
        CartDto dto = mapper.map(cart, CartDto.class);
        if (dto.getItems() == null) {
            return dto;
        }

        dto.getItems().sort((a, b) -> {
            if (a.getCreatedDate() != null && b.getCreatedDate() != null) {
                return a.getCreatedDate().compareTo(b.getCreatedDate());
            }
            if (a.getCartItemId() != null && b.getCartItemId() != null) {
                return a.getCartItemId().compareTo(b.getCartItemId());
            }
            return 0;
        });

        if (cart.getItems() != null) {
            for (CartItem entityItem : cart.getItems()) {
                if (entityItem.getFoodItem() != null) {
                    String foodId = entityItem.getFoodItem().getId();
                    String rawImgUrl = entityItem.getFoodItem().getImageUrl();
                    String resolvedImgUrl = s3Service.generatePresignedUrl(rawImgUrl);

                    for (CartItemDto dtoItem : dto.getItems()) {
                        if (dtoItem.getFoodItem() != null) {
                            if ((foodId != null && foodId.equals(dtoItem.getFoodItem().getId()))
                                    || (dtoItem.getCartItemId() != null && dtoItem.getCartItemId().equals(entityItem.getCartItemId()))) {
                                dtoItem.getFoodItem().setImage(resolvedImgUrl);
                                break;
                            }
                        }
                    }
                }
            }
        }

        return dto;
    }
}
