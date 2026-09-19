package com.tripnest.security.oauth2;

import com.tripnest.entity.AuthProvider;
import com.tripnest.entity.ERole;
import com.tripnest.entity.Role;
import com.tripnest.entity.User;
import com.tripnest.repository.RoleRepository;
import com.tripnest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from Google account");
        }

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setUsername(email.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 6));
            user.setFirstName(name != null ? name : "Google");
            user.setLastName("User");
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            user.setProvider(AuthProvider.GOOGLE);

            Role defaultRole = roleRepository.findByName(ERole.ROLE_USER)
                    .or(() -> roleRepository.findByName(ERole.ROLE_TRAVELER))
                    .orElseGet(() -> {
                        Role r = new Role();
                        r.setName(ERole.ROLE_USER);
                        return roleRepository.save(r);
                    });
            Set<Role> roles = new HashSet<>();
            roles.add(defaultRole);
            user.setRoles(roles);

            userRepository.save(user);
        }

        return oAuth2User;
    }
}