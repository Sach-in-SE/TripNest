package com.tripnest.security;

import com.tripnest.entity.User;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {
        if (username == null || username.trim().isEmpty()) {
            throw new UsernameNotFoundException("User Not Found with empty username or email");
        }
        String identifier = username.trim();
        User user = userRepository.findByUsernameOrEmailWithRoles(identifier)
                .orElseGet(() -> userRepository.findByUsernameIgnoreCase(identifier)
                        .orElseGet(() -> userRepository.findByEmailIgnoreCase(identifier)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                        "User Not Found with username or email: " + identifier))));

        return UserDetailsImpl.build(user);
    }
}