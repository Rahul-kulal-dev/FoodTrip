package com.foodtrip.dto.admin;

public record StatsResponse(long totalUsers, long totalRestaurants, long totalFoodItems, int totalOrders, double totalRevenue) {}
