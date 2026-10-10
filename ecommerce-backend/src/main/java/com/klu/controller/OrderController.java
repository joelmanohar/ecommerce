package com.klu.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.klu.dto.OrderRequest;
import com.klu.model.Order;
import com.klu.model.User;
import com.klu.repository.UserRepository;
import com.klu.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createOrder(
            @RequestBody OrderRequest request,
            Authentication authentication) {

        try {
            String email = authentication.getName();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order order = orderService.createOrder(request, user.getUserId());

            // Return only the orderId — avoids Jackson infinite-recursion
            // from bidirectional JPA relationships (Order→User→Orders…)
            return ResponseEntity.ok(Map.of("orderId", order.getOrderId()));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
