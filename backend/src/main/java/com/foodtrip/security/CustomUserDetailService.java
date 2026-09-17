package com.foodtrip.security;

import com.foodtrip.entity.user.User;
import com.foodtrip.exception.ResourceNotFoundException;
import com.foodtrip.repository.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailService implements UserDetailsService {

    private UserRepository userRepo;

    public CustomUserDetailService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        User user = userRepo.findByEmail(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CustomUserDetail customUserDetail = new CustomUserDetail(user);
        return customUserDetail;
    }
}

