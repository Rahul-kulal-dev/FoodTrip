package com.foodtrip.service.admin;

import com.foodtrip.entity.food.FoodItem;
import com.foodtrip.entity.restaurant.Restaurant;
import com.foodtrip.entity.user.User;
import com.foodtrip.repository.food.FoodItemRepository;
import com.foodtrip.repository.order.OrderRepository;
import com.foodtrip.repository.restaurant.RestaurantRepository;
import com.foodtrip.repository.user.UserRepository;
import com.foodtrip.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.foodtrip.dto.admin.StatsResponse;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final FoodItemRepository foodItemRepository;

    public AdminServiceImpl(UserRepository userRepository,
                            RestaurantRepository restaurantRepository,
                            OrderRepository orderRepository,
                            FoodItemRepository foodItemRepository) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.foodItemRepository = foodItemRepository;
    }

    @Override
    public StatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalRestaurants = restaurantRepository.count();
        long totalFoodItems = foodItemRepository.count();

        long totalOrders = orderRepository.count();
        Double totalRevenue = orderRepository.sumTotalRevenue();

        return new StatsResponse(totalUsers, totalRestaurants, totalFoodItems, (int) totalOrders, totalRevenue != null ? totalRevenue : 0.0);
    }

    @Override
    @Transactional
    public void updateUserStatus(String id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setStatus(status);
        user.setEnabled("ACTIVE".equalsIgnoreCase(status) || "APPROVED".equalsIgnoreCase(status));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateRestaurantStatus(String id, String status) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        restaurant.setStatus(status);
        restaurant.setActive("ACTIVE".equalsIgnoreCase(status) || "APPROVED".equalsIgnoreCase(status));
        restaurantRepository.save(restaurant);
    }

    @Override
    @Transactional
    public void deleteRestaurant(String id) {
        if (!restaurantRepository.existsById(id)) {
            throw new ResourceNotFoundException("Restaurant not found with id: " + id);
        }
        restaurantRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateDishStatus(String id, Boolean status) {
        FoodItem dish = foodItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dish not found with id: " + id));
        if (status != null) {
            dish.setAvailable(status);
            foodItemRepository.save(dish);
        }
    }

    @Override
    @Transactional
    public void deleteDish(String id) {
        if (!foodItemRepository.existsById(id)) {
            throw new ResourceNotFoundException("Dish not found with id: " + id);
        }
        foodItemRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void approveRestaurantVerification(String id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        restaurant.setStatus("APPROVED");
        restaurant.setActive(true);
        restaurantRepository.save(restaurant);
    }

    @Override
    @Transactional
    public void rejectRestaurantVerification(String id, String reason) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        restaurant.setStatus("REJECTED");
        restaurant.setRejectionReason(reason);
        restaurant.setActive(false);
        restaurantRepository.save(restaurant);
    }
}
