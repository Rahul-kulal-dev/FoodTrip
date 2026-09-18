package com.foodtrip.service.user;

import com.foodtrip.dto.user.UserDto;
import com.foodtrip.entity.user.User;
import com.foodtrip.repository.user.UserRepository;
import com.foodtrip.service.user.UserService;
import com.foodtrip.exception.ResourceNotFoundException;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    public UserServiceImpl(UserRepository userRepository, ModelMapper modelMapper) {
        this.userRepository = userRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    @Transactional
    public UserDto saveUser(UserDto user) {
        User savedUser = userRepository.save(modelMapper.map(user, User.class));
        return modelMapper.map(savedUser, UserDto.class);
    }

    @Override
    @Transactional
    public UserDto updateUser(UserDto userDto, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setName(userDto.getName());
        user.setPhone(userDto.getPhone());
        User updated = userRepository.save(user);
        return modelMapper.map(updated, UserDto.class);
    }

    @Override
    @Transactional
    public void deleteUser(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    @Override
    public UserDto getUser(String userId) {
        User user = userRepository.findByIdWithAddresses(userId)
                .orElseThrow(() -> new com.foodtrip.exception.ResourceNotFoundException("User not found with id: " + userId));
        return modelMapper.map(user, UserDto.class);
    }

    @Override
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmailWithAddresses(email)
                .orElseThrow(() -> new com.foodtrip.exception.ResourceNotFoundException("User not found with email: " + email));
        return modelMapper.map(user, UserDto.class);
    }

    @Override
    public List<UserDto> getUsers() {
        return userRepository.findAllWithAddresses().stream()
                .map(user -> modelMapper.map(user, UserDto.class))
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<UserDto> searchUserName(String keyword) {
        return userRepository.searchByNameWithAddresses(keyword).stream()
                .map(user -> modelMapper.map(user, UserDto.class))
                .collect(java.util.stream.Collectors.toList());
    }
}
