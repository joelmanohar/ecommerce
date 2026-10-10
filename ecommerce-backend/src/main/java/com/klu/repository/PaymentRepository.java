package com.klu.repository;

import java.util.Optional;

import com.klu.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderOrderId(Long orderId);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
}
