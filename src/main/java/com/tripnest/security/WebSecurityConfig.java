package com.tripnest.security;

import com.tripnest.security.oauth2.CustomOAuth2UserService;
import com.tripnest.security.oauth2.OAuth2AuthenticationSuccessHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {

    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Autowired
    private OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @org.springframework.beans.factory.annotation.Value("${tripnest.cors.allowed-origins:http://localhost:5173,http://localhost:5174}")
    private String allowedOrigins;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())

                .headers(headers -> headers
                        .contentTypeOptions(org.springframework.security.config.Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)))

                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfig = new org.springframework.web.cors.CorsConfiguration();

                    java.util.List<String> origins = java.util.Arrays.stream(allowedOrigins.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(java.util.stream.Collectors.toList());

                    corsConfig.setAllowedOrigins(origins.isEmpty() ? java.util.List.of("http://localhost:5173", "http://localhost:5174") : origins);

                    corsConfig.setAllowedMethods(java.util.List.of(
                            "GET",
                            "POST",
                            "PUT",
                            "DELETE",
                            "OPTIONS",
                            "PATCH"));

                    corsConfig.setAllowedHeaders(java.util.List.of("*"));
                    corsConfig.setAllowCredentials(true);
                    corsConfig.setExposedHeaders(java.util.List.of(
                            "Authorization",
                            "Content-Type"));

                    return corsConfig;
                }))

                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))

                .authorizeHttpRequests(auth -> auth

                        // CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Actuator health & info probes
                        .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()

                        // Public authentication APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // Public Contact submission API
                        .requestMatchers(HttpMethod.POST, "/api/contact").permitAll()

                        // Admin authentication
                        .requestMatchers("/api/admin/auth/**").permitAll()

                        // Admin panel APIs
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Destination APIs
                        .requestMatchers(HttpMethod.GET, "/api/destinations/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/destinations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/destinations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/destinations/**").hasRole("ADMIN")

                        // Document download endpoint
                        .requestMatchers("/api/documents/download/**").permitAll()

                        // Groups
                        .requestMatchers("/api/groups", "/api/groups/**").authenticated()

                        // Trips
                        .requestMatchers("/api/trips", "/api/trips/**").authenticated()

                        // OAuth2
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                        // Trip sharing
                        .requestMatchers(
                                "/api/trip-shares",
                                "/api/trip-shares/**")
                        .authenticated()

                        // Notifications
                        .requestMatchers(
                                "/api/notifications",
                                "/api/notifications/**")
                        .authenticated()

                        // Travel Memories public gallery and photo serving
                        .requestMatchers(HttpMethod.GET, "/api/memories/public", "/api/memories/photo/**").permitAll()
                        .requestMatchers("/api/memories", "/api/memories/**").authenticated()

                        // Everything else requires authentication
                        .anyRequest().authenticated())

                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler));

        http.authenticationProvider(authenticationProvider());

        http.addFilterBefore(
                authenticationJwtTokenFilter(),
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}