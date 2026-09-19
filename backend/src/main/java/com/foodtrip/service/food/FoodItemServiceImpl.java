package com.foodtrip.service.food;

import com.foodtrip.dto.food.FoodItemDto;
import com.foodtrip.entity.food.FoodItem;
import com.foodtrip.entity.restaurant.Restaurant;
import com.foodtrip.exception.ResourceNotFoundException;
import com.foodtrip.repository.food.FoodItemRepository;
import com.foodtrip.repository.restaurant.RestaurantRepository;
import com.foodtrip.service.s3.S3Service;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FoodItemServiceImpl implements FoodItemService {

    private final FoodItemRepository foodItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final com.foodtrip.repository.cart.CartItemRepository cartItemRepository;
    private final S3Service s3Service;
    private final ModelMapper mapper;

    public FoodItemServiceImpl(FoodItemRepository foodItemRepository,
                               RestaurantRepository restaurantRepository,
                               com.foodtrip.repository.cart.CartItemRepository cartItemRepository,
                               S3Service s3Service,
                               ModelMapper mapper) {
        this.foodItemRepository = foodItemRepository;
        this.restaurantRepository = restaurantRepository;
        this.cartItemRepository = cartItemRepository;
        this.s3Service = s3Service;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public FoodItemDto addFood(FoodItemDto foodItemDto) {
        Restaurant restaurant = restaurantRepository.findById(foodItemDto.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        FoodItem foodItem = new FoodItem();
        foodItem.setName(foodItemDto.getName());
        foodItem.setDescription(foodItemDto.getDescription());
        foodItem.setPrice(foodItemDto.getPrice());
        foodItem.setAvailable(foodItemDto.isAvailable());
        foodItem.setImageUrl(foodItemDto.getImage());
        foodItem.setVeg(foodItemDto.isVeg());
        foodItem.setCategory(foodItemDto.getCategory());
        foodItem.setCreatedDate(LocalDateTime.now());
        foodItem.setRestaurant(restaurant);
        FoodItem savedFood = foodItemRepository.save(foodItem);
        return convertToDto(savedFood);
    }

    @Override
    @Transactional
    public FoodItemDto updateFood(String foodId, FoodItemDto foodItemDto) {
        Restaurant restaurant = restaurantRepository.findById(foodItemDto.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        FoodItem existingFood = foodItemRepository.findByIdWithRestaurant(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("Food item not found with id: " + foodId));

        existingFood.setName(foodItemDto.getName());
        existingFood.setDescription(foodItemDto.getDescription());
        existingFood.setPrice(foodItemDto.getPrice());
        existingFood.setAvailable(foodItemDto.isAvailable());
        existingFood.setImageUrl(foodItemDto.getImage());
        existingFood.setVeg(foodItemDto.isVeg());
        existingFood.setCategory(foodItemDto.getCategory());
        existingFood.setRestaurant(restaurant);
        FoodItem updatedFood = foodItemRepository.save(existingFood);
        return convertToDto(updatedFood);
    }

    @Transactional
    @Override
    public void deleteFood(String foodId) {
        cartItemRepository.deleteByFoodItemId(foodId);
        foodItemRepository.deleteById(foodId);
    }

    @Override
    public List<FoodItemDto> getAllFoods() {
        return foodItemRepository.findAllWithRestaurant().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<FoodItemDto> getFoodsByRestaurant(String restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        return foodItemRepository.findByRestaurant(restaurant).stream()
                .filter(food -> food.getName() != null && !food.getName().trim().isEmpty())
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<FoodItemDto> getAllFoodsByRestaurant(String restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));
        return foodItemRepository.findByRestaurant(restaurant).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public FoodItemDto getFoodById(String foodId) {
        FoodItem foodItem = foodItemRepository.findByIdWithRestaurant(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("Food item not found"));
        return convertToDto(foodItem);
    }

    private FoodItemDto convertToDto(FoodItem foodItem) {
        FoodItemDto dto = mapper.map(foodItem, FoodItemDto.class);
        if (foodItem.getRestaurant() != null) {
            dto.setRestaurantId(foodItem.getRestaurant().getId());
            dto.setRestaurantName(foodItem.getRestaurant().getName());
        }
        dto.setImage(s3Service.generatePresignedUrl(foodItem.getImageUrl()));
        return dto;
    }
}
