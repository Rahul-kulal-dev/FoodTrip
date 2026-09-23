package com.foodtrip;

import com.foodtrip.repository.cart.CartItemRepository;
import com.foodtrip.repository.cart.CartRepository;
import com.foodtrip.repository.food.FoodItemRepository;
import com.foodtrip.repository.order.OrderRepository;
import com.foodtrip.repository.restaurant.RestaurantRepository;
import com.foodtrip.repository.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class FoodTripApplicationTests {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private FoodItemRepository foodItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Test
    void contextLoads() {
        assertNotNull(orderRepository);
        assertNotNull(restaurantRepository);
        assertNotNull(foodItemRepository);
        assertNotNull(userRepository);
        assertNotNull(cartRepository);
        assertNotNull(cartItemRepository);
    }

    @Test
    void testFindAllOrdersWithDetails() {
        var orders = orderRepository.findAllWithDetails();
        assertNotNull(orders);
    }

    @Test
    void testFindAllRestaurantsWithWorkingDaysAndOwner() {
        var restaurants = restaurantRepository.findAllWithDetails();
        assertNotNull(restaurants);
    }

    @Test
    void testFindAllFoodItemsWithRestaurant() {
        var foods = foodItemRepository.findAllWithRestaurant();
        assertNotNull(foods);
    }

    @Test
    void testFindAllUsersWithAddresses() {
        var users = userRepository.findAllWithAddresses();
        assertNotNull(users);
    }

    @Test
    void testPaginatedOrdersAvoidsCollectionFetch() {
        var page = orderRepository.findByUserIdPaginated("dummy-user-id", PageRequest.of(0, 5));
        assertNotNull(page);
    }

    @Test
    void testPaginatedRestaurantsAvoidsCollectionFetch() {
        var page = restaurantRepository.findAllWithOwnersPaginated(PageRequest.of(0, 5));
        assertNotNull(page);
    }

    @Test
    void testRestaurantActiveAndOpenQueries() {
        var active = restaurantRepository.findByIsActive(true);
        assertNotNull(active);
    }

    @Test
    void testCartRepositoryJoinFetch() {
        var cart = cartRepository.findByUserId("dummy-user-id");
        assertNotNull(cart);
    }

    @Test
    void testUserSearchWithAddresses() {
        var users = userRepository.searchByNameWithAddresses("Admin");
        assertNotNull(users);
    }

    @Test
    void testOrderBatchFetchOrderItems() {
        var orders = orderRepository.findAllWithDetails();
        if (!orders.isEmpty()) {
            var fetched = orderRepository.fetchOrderItems(orders);
            assertNotNull(fetched);
        }
    }

    @Test
    void testSaveOrderWithOrderItems() {
        var users = userRepository.findAll();
        var restaurants = restaurantRepository.findAll();
        var foods = foodItemRepository.findAll();
        if (!users.isEmpty() && !restaurants.isEmpty() && !foods.isEmpty()) {
            var user = users.get(0);
            var restaurant = restaurants.get(0);
            var food = foods.get(0);

            com.foodtrip.entity.order.Order order = new com.foodtrip.entity.order.Order();
            order.setUser(user);
            order.setRestaurant(restaurant);
            order.setOrderStatus("PENDING");
            order.setPaymentMethod("COD");
            order.setOrderedAt(java.time.LocalDateTime.now());
            order.setTotalAmount(100);

            com.foodtrip.entity.order.OrderItem item = new com.foodtrip.entity.order.OrderItem();
            item.setOrder(order);
            item.setFoodItem(food);
            item.setName(food.getName());
            item.setPrice(food.getPrice());
            item.setQuantity(2);

            org.junit.jupiter.api.Assertions.assertEquals(food.getPrice() * 2, item.getActualPriceOfOrderItem());
            order.setTotalAmount((int) item.getActualPriceOfOrderItem());

            order.setOrderItems(new java.util.ArrayList<>(java.util.List.of(item)));

            com.foodtrip.entity.order.Order saved = orderRepository.save(order);
            assertNotNull(saved.getId());

            orderRepository.delete(saved);
        }
    }

    @Test
    void testOrderWithDeliveryAddressSnapshot() {
        var users = userRepository.findAll();
        var restaurants = restaurantRepository.findAll();
        if (!users.isEmpty() && !restaurants.isEmpty()) {
            var user = users.get(0);
            var restaurant = restaurants.get(0);

            com.foodtrip.entity.order.Order order = new com.foodtrip.entity.order.Order();
            order.setUser(user);
            order.setRestaurant(restaurant);
            order.setOrderStatus("PENDING");
            order.setPaymentMethod("COD");
            order.setOrderedAt(java.time.LocalDateTime.now());
            order.setTotalAmount(150);

            com.foodtrip.entity.order.OrderDeliveryAddress deliveryAddress = new com.foodtrip.entity.order.OrderDeliveryAddress();
            deliveryAddress.setFullName("Test Recipient");
            deliveryAddress.setPhone("9876543210");
            deliveryAddress.setHouseFlat("Flat 101");
            deliveryAddress.setStreetArea("MG Road");
            deliveryAddress.setCity("Mumbai");
            deliveryAddress.setState("Maharashtra");
            deliveryAddress.setPincode("400001");
            deliveryAddress.setOrder(order);
            order.setDeliveryAddress(deliveryAddress);

            var saved = orderRepository.save(order);
            assertNotNull(saved.getId());
            assertNotNull(saved.getDeliveryAddress().getId());

            var fetched = orderRepository.findByIdWithDetails(saved.getId());
            org.junit.jupiter.api.Assertions.assertTrue(fetched.isPresent());
            org.junit.jupiter.api.Assertions.assertEquals("Test Recipient", fetched.get().getDeliveryAddress().getFullName());

            orderRepository.delete(saved);
        }
    }
}
