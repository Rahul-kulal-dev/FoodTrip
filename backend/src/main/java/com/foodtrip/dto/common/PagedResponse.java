package com.foodtrip.dto.common;

import java.util.List;

public record PagedResponse<T>(boolean success, List<T> data, int page, int limit, long total, int totalPages) {}
