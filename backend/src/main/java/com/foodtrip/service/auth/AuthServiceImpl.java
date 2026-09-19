package com.foodtrip.service.auth;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodtrip.security.JwtService;
import com.foodtrip.dto.auth.JwtResponse;
import com.foodtrip.dto.auth.LoginRequest;
import com.foodtrip.dto.auth.UserRegisterRequest;
import com.foodtrip.dto.restaurant.RestaurantDto;
import com.foodtrip.dto.user.UserDto;
import com.foodtrip.entity.user.Address;
import com.foodtrip.entity.user.Role;
import com.foodtrip.entity.user.User;
import com.foodtrip.exception.ResourceNotFoundException;
import com.foodtrip.repository.user.UserRepository;
import com.foodtrip.service.restaurant.RestaurantService;
import com.foodtrip.service.user.UserService;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RestaurantService restaurantService;

    public AuthServiceImpl(UserService userService, PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager, UserDetailsService userDetailsService,
                           ModelMapper modelMapper, UserRepository userRepository,
                           JwtService jwtService, RestaurantService restaurantService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.modelMapper = modelMapper;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.restaurantService = restaurantService;
    }

    @Override
    @Transactional
    public JwtResponse registerUser(UserRegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User already exists with email: " + request.getEmail());
        }

        Role role = getRole(request.getRole());

        UserDto userDto = modelMapper.map(request, UserDto.class);
        userDto.setPassword(passwordEncoder.encode(request.getPassword()));
        userDto.setRole(role);
        userDto.setCreatedDate(LocalDate.now());
        userDto.setEnabled(true);

        UserDto createdUser = userService.saveUser(userDto);

        if (role == Role.RESTAURANT) {
            linkRestaurant(createdUser);
        }

        String token = jwtService.generateToken(createdUser.getEmail(), true);

        return JwtResponse.builder()
                .token(token)
                .user(createdUser)
                .build();
    }

    private Role getRole(String role) {
        return "Restaurant".equalsIgnoreCase(role)
                ? Role.RESTAURANT
                : Role.CUSTOMER;
    }

    private void linkRestaurant(UserDto user) {

        RestaurantDto restaurant =restaurantService.createDefaultRestaurantForUser(user);

        User existingUser = userRepository.findById(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        existingUser.setRestaurantId(restaurant.getId());
        userRepository.save(existingUser);

        user.setRestaurantId(restaurant.getId());
    }

    @Override
    public JwtResponse login(LoginRequest request) {
        String email = request.getEmail();

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(email, request.getPassword());

        authenticationManager.authenticate(authentication);

        User user = userRepository.findByEmailWithAddresses(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserDto userDto = modelMapper.map(user, UserDto.class);

        String accessToken = jwtService.generateToken(email, true);

        return JwtResponse.builder()
                .token(accessToken)
                .user(userDto)
                .build();
    }

    @Override
    public UserDto getMe() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            UserDetails userDetails = (UserDetails) auth.getPrincipal();
            Optional<User> user = userRepository.findByEmailWithAddresses(userDetails.getUsername());
            if (user.isPresent()) {
                return modelMapper.map(user.get(), UserDto.class);
            }
        }
        return null;
    }

    @Override
    @Transactional
    public UserDto updateMe(Map<String, Object> updateRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            UserDetails userDetails = (UserDetails) auth.getPrincipal();
            Optional<User> optUser = userRepository.findByEmailWithAddresses(userDetails.getUsername());
            if (optUser.isPresent()) {
                User user = optUser.get();
                if (updateRequest.containsKey("name")) user.setName((String) updateRequest.get("name"));
                if (updateRequest.containsKey("email")) user.setEmail((String) updateRequest.get("email"));
                if (updateRequest.containsKey("phone")) user.setPhone((String) updateRequest.get("phone"));
                if (updateRequest.containsKey("addresses")) {
                    Object addressesObj = updateRequest.get("addresses");
                    if (addressesObj instanceof List) {
                        List<?> list = (List<?>) addressesObj;
                        ObjectMapper mapper = new ObjectMapper();
                        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
                        List<Address> currentAddresses = user.getAddresses();
                        for (Object item : list) {
                            try {
                                Address addr = mapper.convertValue(item, Address.class);

                                boolean isHouseEmpty = addr.getHouseFlat() == null || addr.getHouseFlat().trim().isEmpty();
                                boolean isStreetEmpty = addr.getStreetArea() == null || addr.getStreetArea().trim().isEmpty();
                                if (isHouseEmpty && isStreetEmpty) {
                                    continue;
                                }

                                java.util.Optional<Address> existing = java.util.Optional.empty();
                                if (addr.getId() != null && !addr.getId().trim().isEmpty() && !addr.getId().startsWith("addr-")) {
                                    existing = currentAddresses.stream()
                                            .filter(a -> a.getId() != null && a.getId().equals(addr.getId()))
                                            .findFirst();
                                }

                                if (existing.isEmpty()) {
                                    existing = currentAddresses.stream()
                                            .filter(a -> isDuplicateAddress(a, addr))
                                            .findFirst();
                                }

                                if (existing.isPresent()) {
                                    Address e = existing.get();
                                    if (addr.getFullName() != null && !addr.getFullName().trim().isEmpty()) e.setFullName(addr.getFullName().trim());
                                    if (addr.getPhone() != null && !addr.getPhone().trim().isEmpty()) e.setPhone(addr.getPhone().trim());
                                    if (addr.getHouseFlat() != null && !addr.getHouseFlat().trim().isEmpty()) e.setHouseFlat(addr.getHouseFlat().trim());
                                    if (addr.getStreetArea() != null && !addr.getStreetArea().trim().isEmpty()) e.setStreetArea(addr.getStreetArea().trim());
                                    if (addr.getCity() != null && !addr.getCity().trim().isEmpty()) e.setCity(addr.getCity().trim());
                                    if (addr.getState() != null && !addr.getState().trim().isEmpty()) e.setState(addr.getState().trim());
                                    if (addr.getPincode() != null && !addr.getPincode().trim().isEmpty()) e.setPincode(addr.getPincode().trim());
                                    if (addr.getAddressType() != null && !addr.getAddressType().trim().isEmpty()) {
                                        e.setAddressType(addr.getAddressType().trim().toUpperCase());
                                    }
                                } else {
                                    addr.setId(null);
                                    if (addr.getAddressType() == null || addr.getAddressType().trim().isEmpty()) {
                                        addr.setAddressType("HOME");
                                    } else {
                                        addr.setAddressType(addr.getAddressType().trim().toUpperCase());
                                    }
                                    addr.setUser(user);
                                    currentAddresses.add(addr);
                                }
                            } catch (Exception e) {
                            }
                        }
                    }
                }

                userRepository.save(user);
                return modelMapper.map(user, UserDto.class);
            }
        }
        return null;
    }

    @Override
    public String getLoggedInUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"))
                .getId();
    }

    @Override
    public String getLoggedInUserRestaurantId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"))
                .getRestaurantId();
    }

    @Override
    public boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private boolean isDuplicateAddress(Address a, Address b) {
        if (a == null || b == null) return false;
        if (a.getId() != null && b.getId() != null && a.getId().equals(b.getId())) return true;

        String aHouse = a.getHouseFlat() != null ? a.getHouseFlat().trim() : "";
        String bHouse = b.getHouseFlat() != null ? b.getHouseFlat().trim() : "";
        String aStreet = a.getStreetArea() != null ? a.getStreetArea().trim() : "";
        String bStreet = b.getStreetArea() != null ? b.getStreetArea().trim() : "";
        String aCity = a.getCity() != null ? a.getCity().trim() : "";
        String bCity = b.getCity() != null ? b.getCity().trim() : "";
        String aPincode = a.getPincode() != null ? a.getPincode().trim() : "";
        String bPincode = b.getPincode() != null ? b.getPincode().trim() : "";

        if (!aHouse.isEmpty() && !aStreet.isEmpty() && aHouse.equalsIgnoreCase(bHouse) && aStreet.equalsIgnoreCase(bStreet)) {
            if ((aCity.isEmpty() || bCity.isEmpty() || aCity.equalsIgnoreCase(bCity)) &&
                (aPincode.isEmpty() || bPincode.isEmpty() || aPincode.equalsIgnoreCase(bPincode))) {
                return true;
            }
        }

        return false;
    }
}
