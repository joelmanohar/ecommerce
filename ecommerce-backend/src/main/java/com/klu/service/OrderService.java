package com.klu.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.klu.dto.OrderItemRequest;
import com.klu.dto.OrderRequest;
import com.klu.model.Order;
import com.klu.model.OrderItem;
import com.klu.model.Product;
import com.klu.model.User;
import com.klu.repository.OrderRepository;
import com.klu.repository.ProductRepository;
import com.klu.repository.UserRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public Order createOrder(OrderRequest request, Long userId) {

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("An order must contain at least one item");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setUser(user);
        order.setStatus("PENDING");

        List<OrderItem> orderItems = new ArrayList<>();

        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {

            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new IllegalArgumentException("Item quantity must be greater than zero");
            }

            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            if (product.getPrice() == null || product.getPrice() < 0) {
                throw new IllegalArgumentException("Product has an invalid price");
            }

            if (product.getStock() < itemRequest.getQuantity()) {
                throw new RuntimeException(
                        "Insufficient stock for " + product.getProductName());
            }

            OrderItem item = new OrderItem();

            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemRequest.getQuantity());
           item.setPrice(BigDecimal.valueOf(product.getPrice()));

            orderItems.add(item);

            BigDecimal itemTotal =
                BigDecimal.valueOf(product.getPrice())
                .multiply(
                        BigDecimal.valueOf(itemRequest.getQuantity())
                );

            total = total.add(itemTotal);
        }

        order.setTotalAmount(total);
        order.setItems(orderItems);

        return orderRepository.save(order);
    }
}
