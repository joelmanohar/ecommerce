package com.klu.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // =====================================================
    // WebSocket chain — must run BEFORE the main chain
    // =====================================================
    @Bean
    @Order(1)
    public SecurityFilterChain webSocketSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/ws-smartcart", "/ws-smartcart/**")
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // ==============================
            // CORS
            // ==============================
            .cors(cors -> cors
                .configurationSource(corsConfigurationSource())
            )

            // ==============================
            // CSRF (disabled for API usage)
            // ==============================
            .csrf(csrf -> csrf.disable())

            // ==============================
            // AUTHORIZATION
            // ==============================
            .authorizeHttpRequests(auth -> auth

                // OPTIONS requests
                .requestMatchers(HttpMethod.OPTIONS, "/**")
                .permitAll()

                // Authentication APIs (login, signup, logout, session check)
                .requestMatchers("/api/auth/**")
                .permitAll()

                // ==============================
                // PRODUCTS
                // ==============================

                // Anyone can view products
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/products/**"
                )
                .permitAll()

                // Only ADMIN can create products
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/products/**"
                )
                .hasRole("ADMIN")

                // Only ADMIN can update products
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/products/**"
                )
                .hasRole("ADMIN")

                // Only ADMIN can delete products
                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/products/**"
                )
                .hasRole("ADMIN")

                // ==============================
                // ORDERS
                // ==============================

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/orders"
                )
                .authenticated()

                .requestMatchers(
                    "/api/orders/**"
                )
                .authenticated()

                // ==============================
                // PAYMENT
                // ==============================

                // Razorpay webhook must be public
                .requestMatchers(
                    "/api/payment/webhook"
                )
                .permitAll()

                // Create payment requires login
                .requestMatchers(
                    "/api/payment/create/**"
                )
                .authenticated()

                // Verify payment requires login
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/payment/verify"
                )
                .authenticated()

                // COD order requires login
                .requestMatchers(
                    "/api/payment/cod/**"
                )
                .authenticated()

                // ==============================
                // JOBS MONITORING (CO5) — Admin only
                // ==============================
                .requestMatchers("/api/jobs/**")
                .hasRole("ADMIN")

                // ==============================
                // EVERYTHING ELSE
                // ==============================

                // MUST ALWAYS BE LAST
                .anyRequest()
                .authenticated()
            )

            // ==============================
            // ==============================
            // SECURITY CONTEXT & SESSION
            // ==============================
            .securityContext(securityContext -> securityContext
                .securityContextRepository(new org.springframework.security.web.context.HttpSessionSecurityContextRepository())
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.IF_REQUIRED
                )
            );

        return http.build();
    }

    // =====================================================
    // CORS CONFIGURATION
    // =====================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
            new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:5177"
        ));

        configuration.setAllowedMethods(List.of(
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ));

        configuration.setAllowedHeaders(
            List.of("*")
        );

        // Important: allow cookies/session to be sent cross-origin
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            configuration
        );

        return source;
    }
}