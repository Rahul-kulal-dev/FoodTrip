package com.foodtrip.service.order;

import com.foodtrip.dto.order.OrderDeliveryAddressDto;
import com.foodtrip.dto.order.OrderDto;
import com.foodtrip.dto.order.PlaceOrderRequest;
import com.foodtrip.dto.user.AddressDto;
import com.foodtrip.entity.cart.Cart;
import com.foodtrip.entity.cart.CartItem;
import com.foodtrip.entity.food.FoodItem;
import com.foodtrip.entity.order.Order;
import com.foodtrip.entity.order.OrderDeliveryAddress;
import com.foodtrip.entity.order.OrderItem;
import com.foodtrip.entity.restaurant.Restaurant;
import com.foodtrip.entity.user.User;
import com.foodtrip.exception.ResourceNotFoundException;
import com.foodtrip.repository.cart.CartRepository;
import com.foodtrip.repository.order.OrderRepository;
import com.foodtrip.repository.restaurant.RestaurantRepository;
import com.foodtrip.repository.user.UserRepository;
import com.foodtrip.service.s3.S3Service;
import lombok.AllArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ModelMapper mapper;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final RestaurantRepository restaurantRepository;
    private final S3Service s3Service;

    @Override
    @Transactional
    public OrderDto placeOrder(PlaceOrderRequest request, String userId) {

        User user = userRepository.findByIdWithAddresses(userId)
                .orElseGet(() -> userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId)));

        Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + user.getId()));

        List<CartItem> cartItems = cart.getItems();
        if (cartItems == null || cartItems.isEmpty()) {
            throw new ResourceNotFoundException("Cart is empty. Please add items to your cart before placing an order.");
        }

        final String restaurantId = cartItems.get(0).getFoodItem().getRestaurant().getId();

        Restaurant restaurant = restaurantRepository.findByIdWithDetails(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        if (!restaurant.isOpenNow()) {
            throw new IllegalArgumentException("Restaurant '" + restaurant.getName() + "' is currently closed");
        }

        Order order = new Order();
        order.setUser(user);
        order.setRestaurant(restaurant);

        AddressDto addressDto = new AddressDto();
        if (request.getAddressId() != null && !request.getAddressId().trim().isEmpty()) {
            addressDto.setId(request.getAddressId());
        }
        if (request.getDeliveryAddress() != null && !request.getDeliveryAddress().trim().isEmpty()) {
            String[] parts = request.getDeliveryAddress().split(",");
            if (parts.length >= 1) addressDto.setHouseFlat(parts[0].trim());
            if (parts.length >= 2) addressDto.setStreetArea(parts[1].trim());
            if (parts.length >= 3) addressDto.setCity(parts[2].trim());
            if (parts.length >= 4) addressDto.setState(parts[3].trim());
            if (parts.length >= 5) addressDto.setPincode(parts[4].trim());
        }

        OrderDeliveryAddress deliveryAddressSnapshot = createDeliveryAddressSnapshot(addressDto, user);
        deliveryAddressSnapshot.setOrder(order);
        order.setDeliveryAddress(deliveryAddressSnapshot);

        order.setOrderStatus("PENDING");
        order.setOrderedAt(LocalDateTime.now());
        order.setPaymentMethod(request.getPaymentMethod() != null && !request.getPaymentMethod().trim().isEmpty()
                ? request.getPaymentMethod() : "COD");

        List<OrderItem> orderItems = cartItems.stream()
                .map(cartItem -> {
                    FoodItem foodItem = cartItem.getFoodItem();
                    if (foodItem == null) {
                        throw new ResourceNotFoundException("Food item not found in cart");
                    }
                    if (!foodItem.isAvailable()) {
                        throw new IllegalArgumentException("Food item '" + foodItem.getName() + "' is currently unavailable");
                    }

                    OrderItem orderItem = new OrderItem();
                    orderItem.setOrder(order);
                    orderItem.setQuantity(cartItem.getQuantity());
                    orderItem.setFoodItem(foodItem);

                    orderItem.setName(foodItem.getName());
                    orderItem.setPrice(foodItem.actualPrice());
                    orderItem.setImage(foodItem.getImageUrl());
                    orderItem.setVeg(foodItem.isVeg());

                    return orderItem;
                })
                .collect(Collectors.toList());

        int total = (int) Math.round(orderItems.stream()
                .mapToDouble(OrderItem::getActualPriceOfOrderItem)
                .sum());
        order.setTotalAmount(total);
        order.setOrderItems(orderItems);
        if (order.getOrderNumber() == null) {
            order.setOrderNumber("ORD-" + System.currentTimeMillis());
        }

        Order savedOrder = orderRepository.save(order);

        cart.getItems().clear();
        cartRepository.save(cart);

        return mapToDto(savedOrder);
    }

    private OrderDeliveryAddress createDeliveryAddressSnapshot(AddressDto addressDto, User user) {

        OrderDeliveryAddress snapshot = new OrderDeliveryAddress();

        snapshot.setFullName(addressDto.getFullName() != null ? addressDto.getFullName() : user.getName());

        snapshot.setPhone(addressDto.getPhone() != null ? addressDto.getPhone() : user.getPhone());

        snapshot.setHouseFlat(addressDto.getHouseFlat());
        snapshot.setStreetArea(addressDto.getStreetArea());
        snapshot.setCity(addressDto.getCity());
        snapshot.setState(addressDto.getState());
        snapshot.setPincode(addressDto.getPincode());

        snapshot.setAddressType( addressDto.getAddressType() != null? addressDto.getAddressType() : "HOME");

        return snapshot;
    }

    @Override
    public List<OrderDto> getOrders() {
        List<Order> orders = orderRepository.findAllWithDetails();
        return orders.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderDto> getOrderByRestaurant(String restaurantId) {
        List<Order> orders = orderRepository.findByRestaurantId(restaurantId);
        return orders.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderDto> getOrderByUser(String userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<OrderDto> getOrderByUser(String userId, Pageable pageable) {
        Page<Order> orderPage = orderRepository.findByUserIdPaginated(userId, pageable);
        if (!orderPage.isEmpty()) {
            orderRepository.fetchOrderItems(orderPage.getContent());
        }
        return orderPage.map(this::mapToDto);
    }

    @Override
    public OrderDto trackOrder(String orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return mapToDto(order);
    }

    @Override
    @Transactional
    public OrderDto cancelOrder(String orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        order.setOrderStatus("CANCELLED");
        Order savedOrder = orderRepository.save(order);
        return mapToDto(savedOrder);
    }

    @Override
    @Transactional
    public OrderDto updateOrderStatus(String orderId, String orderStatus) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        order.setOrderStatus(orderStatus);
        Order savedOrder = orderRepository.save(order);
        return mapToDto(savedOrder);
    }

    private OrderDto mapToDto(Order order) {
        OrderDto dto = mapper.map(order, OrderDto.class);

        if (order.getDeliveryAddress() != null) {
            OrderDeliveryAddressDto deliveryDto = mapper.map(order.getDeliveryAddress(), OrderDeliveryAddressDto.class);
            dto.setDeliveryAddress(deliveryDto);
        }

        if (dto.getOrderItems() != null && !dto.getOrderItems().isEmpty()) {
            if (dto.getItems() == null || dto.getItems().isEmpty()) {
                dto.setItems(dto.getOrderItems());
            }
        } else if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            if (dto.getOrderItems() == null || dto.getOrderItems().isEmpty()) {
                dto.setOrderItems(dto.getItems());
            }
        }

        if (dto.getItems() != null) {
            dto.getItems().forEach(item -> {
                if (item.getImage() != null) {
                    item.setImage(s3Service.generatePresignedUrl(item.getImage()));
                }
                if (item.getFoodItem() != null && item.getFoodItem().getImage() != null) {
                    item.getFoodItem().setImage(s3Service.generatePresignedUrl(item.getFoodItem().getImage()));
                }
            });
        }
        if (dto.getRestaurant() != null) {
            dto.getRestaurant().setCoverImage(s3Service.generatePresignedUrl(dto.getRestaurant().getCoverImage()));
            dto.getRestaurant().setLogoImage(s3Service.generatePresignedUrl(dto.getRestaurant().getLogoImage()));
            dto.getRestaurant().setImage(dto.getRestaurant().getCoverImage());
            dto.getRestaurant().setBannerImage(dto.getRestaurant().getCoverImage());
            dto.getRestaurant().setLogo(dto.getRestaurant().getLogoImage());
        }
        return dto;
    }
}
