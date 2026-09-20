package com.foodtrip.service.admin;

import com.foodtrip.dto.admin.StatsResponse;

public interface AdminService {
    StatsResponse getStats();
    void updateUserStatus(String id, String status);
    void deleteUser(String id);
    void updateRestaurantStatus(String id, String status);
    void deleteRestaurant(String id);
    void updateDishStatus(String id, Boolean status);
    void deleteDish(String id);
    void approveRestaurantVerification(String id);
    void rejectRestaurantVerification(String id, String reason);
}
