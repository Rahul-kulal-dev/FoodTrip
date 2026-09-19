package com.foodtrip.service.restaurant;

import com.foodtrip.dto.restaurant.RestaurantDto;
import com.foodtrip.dto.user.UserDto;
import com.foodtrip.entity.restaurant.CuisineType;
import com.foodtrip.entity.user.User;
import com.foodtrip.entity.restaurant.Restaurant;
import com.foodtrip.exception.ResourceNotFoundException;
import com.foodtrip.repository.restaurant.RestaurantRepository;
import com.foodtrip.service.s3.S3Service;
import jakarta.persistence.criteria.Predicate;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.foodtrip.dto.restaurant.SubmitVerificationRequest;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class RestaurantServiceImpl implements RestaurantService {

    private static final List<String> ALL_DAYS = List.of(
            "Monday", "Tuesday", "Wednesday", "Thursday",
            "Friday", "Saturday", "Sunday"
    );

    private final RestaurantRepository restaurantRepository;
    private final ModelMapper modelMapper;
    private final S3Service s3Service;

    public RestaurantServiceImpl(RestaurantRepository restaurantRepository, ModelMapper modelMapper, S3Service s3Service) {
        this.restaurantRepository = restaurantRepository;
        this.modelMapper = modelMapper;
        this.s3Service = s3Service;
    }

    @Override
    @Transactional
    public RestaurantDto addRestaurant(RestaurantDto restaurantDto) {
        Restaurant restaurant = modelMapper.map(restaurantDto, Restaurant.class);
        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        return mapToDto(savedRestaurant);
    }

    @Override
    @Transactional
    public RestaurantDto createDefaultRestaurantForUser(com.foodtrip.dto.user.UserDto userDto) {
        Restaurant restaurant = new Restaurant();
        restaurant.setName(userDto.getName() + "'s Restaurant");
        restaurant.setEmail(userDto.getEmail());

        User owner = new User();
        owner.setId(userDto.getId());
        restaurant.setOwnerUser(owner);

        restaurant.setStatus("Pending");
        restaurant.setActive(false);
        restaurant.setWorkingDays(new ArrayList<>(ALL_DAYS));

        restaurant = restaurantRepository.save(restaurant);
        return mapToDto(restaurant);
    }

    @Override
    @Transactional
    public RestaurantDto updateRestaurant(RestaurantDto restaurantDto, String restaurantId) {
        Restaurant existingRestaurant = restaurantRepository.findByIdWithDetails(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant Not Found"));

        String prevLogo = existingRestaurant.getLogoImage();
        String prevCover = existingRestaurant.getCoverImage();

        modelMapper.map(restaurantDto, existingRestaurant);
        existingRestaurant.setId(restaurantId);

        if (restaurantDto.getCoverImage() != null && !restaurantDto.getCoverImage().trim().isEmpty()) {
            existingRestaurant.setCoverImage(restaurantDto.getCoverImage());
            if (restaurantDto.getLogoImage() == null) {
                existingRestaurant.setLogoImage(prevLogo);
            }
        }
        if (restaurantDto.getLogoImage() != null && !restaurantDto.getLogoImage().trim().isEmpty()) {
            existingRestaurant.setLogoImage(restaurantDto.getLogoImage());
            if (restaurantDto.getCoverImage() == null) {
                existingRestaurant.setCoverImage(prevCover);
            }
        }

        Restaurant updatedRestaurant = restaurantRepository.save(existingRestaurant);
        return mapToDto(updatedRestaurant);
    }

    @Override
    @Transactional
    public void deleteRestaurant(String restaurantId) {
        Restaurant existingRestaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant Not Found"));
        restaurantRepository.delete(existingRestaurant);
    }

    @Override
    public RestaurantDto getRestaurant(String restaurantId) {
        Restaurant restaurant = restaurantRepository.findByIdWithDetails(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant Not Found"));
        return mapToDto(restaurant);
    }

    @Override
    public Page<RestaurantDto> getRestaurants(Pageable pageable) {
        Page<Restaurant> pageRestaurant = restaurantRepository.findAllWithOwnersPaginated(pageable);
        if (!pageRestaurant.isEmpty()) {
            restaurantRepository.fetchDetailsForRestaurants(pageRestaurant.getContent());
        }
        return pageRestaurant.map(this::mapToDto);
    }

    @Override
    public Page<RestaurantDto> getApprovedRestaurants(
            String search,
            String cuisine,
            String status,
            String customSort,
            String sortBy,
            String sortDir,
            int page,
            int limit) {

        Specification<Restaurant> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.or(
                    cb.equal(cb.upper(root.get("status")), "APPROVED"),
                    cb.equal(cb.upper(root.get("status")), "ACTIVE")
            ));

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                List<Predicate> searchPredicates = new ArrayList<>();
                searchPredicates.add(cb.like(cb.lower(root.get("name")), searchPattern));

                String cleanSearch = search.trim().toLowerCase().replace(" ", "_");
                for (CuisineType ct : CuisineType.values()) {
                    if (ct.name().toLowerCase().contains(cleanSearch)) {
                        searchPredicates.add(cb.equal(root.get("cuisine"), ct));
                    }
                }
                predicates.add(cb.or(searchPredicates.toArray(new Predicate[0])));
            }

            if (cuisine != null && !cuisine.trim().isEmpty() && !cuisine.equalsIgnoreCase("all")) {
                String cleanCuisine = cuisine.trim().toUpperCase().replace(" ", "_").replace("-", "_");
                List<Predicate> cuisinePredicates = new ArrayList<>();
                for (CuisineType ct : CuisineType.values()) {
                    if (ct.name().equalsIgnoreCase(cleanCuisine) ||
                        ct.name().replace("_", "").equalsIgnoreCase(cleanCuisine.replace("_", ""))) {
                        cuisinePredicates.add(cb.equal(root.get("cuisine"), ct));
                    }
                }
                if (!cuisinePredicates.isEmpty()) {
                    predicates.add(cb.or(cuisinePredicates.toArray(new Predicate[0])));
                }
            }

            if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all")) {
                if (status.equalsIgnoreCase("open") || status.equalsIgnoreCase("opennow") || status.equalsIgnoreCase("open now")) {
                    predicates.add(cb.isTrue(root.get("isOpen")));
                } else if (status.equalsIgnoreCase("closed") || status.equalsIgnoreCase("close")) {
                    predicates.add(cb.isFalse(root.get("isOpen")));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort;
        if (customSort != null && !customSort.trim().isEmpty()) {
            if ("-rating".equalsIgnoreCase(customSort)) {
                sort = Sort.by(Sort.Direction.DESC, "rating");
            } else if ("rating".equalsIgnoreCase(customSort)) {
                sort = Sort.by(Sort.Direction.ASC, "rating");
            } else if ("-createdAt".equalsIgnoreCase(customSort) || "-createdDate".equalsIgnoreCase(customSort) || "newest".equalsIgnoreCase(customSort)) {
                sort = Sort.by(Sort.Direction.DESC, "createdDate");
            } else if ("createdAt".equalsIgnoreCase(customSort) || "createdDate".equalsIgnoreCase(customSort) || "oldest".equalsIgnoreCase(customSort)) {
                sort = Sort.by(Sort.Direction.ASC, "createdDate");
            } else {
                sort = Sort.by(Sort.Direction.DESC, "rating");
            }
        } else {
            String effectiveSortBy = (sortBy != null && !sortBy.trim().isEmpty()) ? sortBy : "name";
            if ("createdAt".equalsIgnoreCase(effectiveSortBy)) {
                effectiveSortBy = "createdDate";
            }
            Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
            sort = Sort.by(direction, effectiveSortBy);
        }

        int pageIndex = Math.max(0, page - 1);
        int pageSize = Math.max(1, limit);
        Pageable pageable = PageRequest.of(pageIndex, pageSize, sort);

        Page<Restaurant> restaurantPage = restaurantRepository.findAll(spec, pageable);
        if (!restaurantPage.isEmpty()) {
            restaurantRepository.fetchDetailsForRestaurants(restaurantPage.getContent());
        }
        return restaurantPage.map(this::mapToDto);
    }

    @Override
    public List<RestaurantDto> getByOwner(String ownerId) {
        List<Restaurant> restaurants = restaurantRepository.findByOwnerId(ownerId);
        return restaurants.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<RestaurantDto> searchByName(String nameKeyword) {
        List<Restaurant> restaurants = restaurantRepository.searchByName(nameKeyword);
        return restaurants.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<RestaurantDto> searchByAddress(String address) {
        List<Restaurant> restaurants = restaurantRepository.searchByAddress(address);
        return restaurants.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<RestaurantDto> getByIsActive(Boolean isActive) {
        if (isActive == null) return List.of();
        List<Restaurant> restaurants = restaurantRepository.findByIsActive(isActive);
        return restaurants.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<RestaurantDto> getByOpen(Boolean isOpen) {
        if (isOpen == null) return List.of();
        List<Restaurant> restaurants = restaurantRepository.findAllWithDetails();
        return restaurants.stream()
                .filter(r -> r.isOpenNow() == isOpen)
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<RestaurantDto> getByIsActiveAndOpen(Boolean isActive, Boolean isOpen) {
        List<Restaurant> restaurants = isActive != null
                ? restaurantRepository.findByIsActive(isActive)
                : restaurantRepository.findAllWithDetails();
        return restaurants.stream()
                .filter(r -> (isActive == null || r.isActive() == isActive) && (isOpen == null || r.isOpenNow() == isOpen))
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<RestaurantDto> getByStatus(String status) {
        List<Restaurant> restaurants = restaurantRepository.findByStatus(status);
        return restaurants.stream()
                .map(this::mapToDto)
                .toList();
    }

    @Override
    public List<RestaurantDto> getByVerificationStatus(String status) {
        return getByStatus(status);
    }

    @Override
    @Transactional
    public RestaurantDto submitVerification(String restaurantId, SubmitVerificationRequest payload) {
        Restaurant restaurant = restaurantRepository.findByIdWithDetails(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found"));

        if (payload.restaurantName() != null) restaurant.setName(payload.restaurantName());
        if (payload.phone() != null) restaurant.setPhone(payload.phone());
        if (payload.restaurantAddress() != null) restaurant.setAddress(payload.restaurantAddress());
        if (payload.licenseNo() != null) restaurant.setFssaiLicenseNo(payload.licenseNo());

        if (payload.documentInfo() != null && payload.documentInfo().fssaiDocUrl() != null) {
            restaurant.setFssaiDocUrl(payload.documentInfo().fssaiDocUrl());
        } else if (payload.fssaiDocUrl() != null) {
            restaurant.setFssaiDocUrl(payload.fssaiDocUrl());
        }

        restaurant.setStatus("PENDING");

        restaurantRepository.save(restaurant);
        return getRestaurant(restaurantId);
    }

    public RestaurantDto mapToDto(Restaurant restaurant) {
        if (restaurant == null) return null;

        RestaurantDto dto = new RestaurantDto();
        dto.setId(restaurant.getId());
        dto.setCode(restaurant.getCode());
        dto.setName(restaurant.getName());
        dto.setDescription(restaurant.getDescription());
        dto.setOwner(restaurant.getOwner());
        dto.setEmail(restaurant.getEmail());
        dto.setPhone(restaurant.getPhone());
        dto.setCuisine(restaurant.getCuisine());
        dto.setAddress(restaurant.getAddress());
        dto.setCity(restaurant.getCity());
        dto.setState(restaurant.getState());
        dto.setPincode(restaurant.getPincode());
        dto.setLocation(restaurant.getLocation());
        dto.setOpeningTime(restaurant.getOpeningTime());
        dto.setClosingTime(restaurant.getClosingTime());
        dto.setIsActive(restaurant.isActive());
        dto.setIsOpen(restaurant.isOpen());
        dto.setStatus(restaurant.getStatus());
        dto.setRejectionReason(restaurant.getRejectionReason());
        dto.setFssaiLicenseNo(restaurant.getFssaiLicenseNo());
        dto.setRating(restaurant.getRating());
        dto.setIsOpenNow(restaurant.isOpenNow());

        List<String> days = (restaurant.getWorkingDays() != null && !restaurant.getWorkingDays().isEmpty())
                ? new ArrayList<>(restaurant.getWorkingDays())
                : new ArrayList<>(ALL_DAYS);
        days.sort(java.util.Comparator.comparingInt(d -> {
            int idx = ALL_DAYS.indexOf(d);
            return idx >= 0 ? idx : 99;
        }));
        dto.setWorkingDays(days);

        if (restaurant.getOwnerUser() != null) {
            User u = restaurant.getOwnerUser();
            UserDto uDto = new UserDto();
            uDto.setId(u.getId());
            uDto.setName(u.getName());
            uDto.setEmail(u.getEmail());
            uDto.setPhone(u.getPhone());
            uDto.setRole(u.getRole());
            uDto.setStatus(u.getStatus());
            uDto.setVerificationStatus(u.getVerificationStatus());
            uDto.setRestaurantId(u.getRestaurantId());
            uDto.setCreatedDate(u.getCreatedDate());
            uDto.setEnabled(u.isEnabled());
            dto.setOwnerUser(uDto);

            if (dto.getOwner() == null || dto.getOwner().trim().isEmpty()) {
                dto.setOwner(u.getName());
            }
            if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
                dto.setEmail(u.getEmail());
            }
            if ((dto.getPhone() == null || dto.getPhone().trim().isEmpty()) && u.getPhone() != null && !u.getPhone().trim().isEmpty()) {
                dto.setPhone(u.getPhone());
            }
        }

        dto.setCoverImage(s3Service.generatePresignedUrl(restaurant.getCoverImage()));
        dto.setLogoImage(s3Service.generatePresignedUrl(restaurant.getLogoImage()));
        dto.setImage(dto.getCoverImage());
        dto.setBannerImage(dto.getCoverImage());
        dto.setLogo(dto.getLogoImage());
        if (restaurant.getFssaiDocUrl() != null && !restaurant.getFssaiDocUrl().isEmpty()) {
            dto.setFssaiDocUrl(s3Service.generatePresignedUrl(restaurant.getFssaiDocUrl()));
        }

        dto.setCreatedDate(restaurant.getCreatedDate());

        return dto;
    }
}
