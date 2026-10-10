package com.klu.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.klu.dto.PaymentVerifyRequest;
import com.klu.model.Order;
import com.klu.model.Payment;
import com.klu.repository.OrderRepository;
import com.klu.repository.PaymentRepository;
import com.razorpay.RazorpayClient;

@Service
public class PaymentService {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final BackgroundJobService backgroundJobService;

    public PaymentService(
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            BackgroundJobService backgroundJobService) {

        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.backgroundJobService = backgroundJobService;
    }

    // -----------------------------------------------------------------------
    // Razorpay online payment
    // -----------------------------------------------------------------------

    public Map<String, Object> createRazorpayOrder(Long orderId, String userEmail) throws Exception {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Order not found");
        }

        Payment payment = paymentRepository.findByOrderOrderId(orderId)
                .orElseGet(Payment::new);
        if ("PAID".equals(payment.getStatus())) {
            throw new RuntimeException("Order is already paid");
        }

        RazorpayClient razorpayClient =
                new RazorpayClient(keyId, keySecret);

        long amountInPaise =
                order.getTotalAmount()
                     .multiply(BigDecimal.valueOf(100))
                     .longValue();

        JSONObject options = new JSONObject();

        options.put("amount", amountInPaise);
        options.put("currency", "INR");
        options.put("receipt", "order_" + orderId);

        com.razorpay.Order razorpayOrder =
                razorpayClient.orders.create(options);

        payment.setOrder(order);
        payment.setRazorpayOrderId(razorpayOrder.get("id"));
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentMethod("RAZORPAY");
        payment.setStatus("CREATED");

        paymentRepository.save(payment);

        Map<String, Object> response = new HashMap<>();

        response.put("keyId", keyId);
        response.put("orderId", orderId);
        response.put("razorpayOrderId", razorpayOrder.get("id"));
        response.put("amount", amountInPaise);
        response.put("currency", "INR");

        return response;
    }

    public boolean verifyPayment(PaymentVerifyRequest request, String userEmail)
            throws Exception {

        Payment payment = paymentRepository
                .findByOrderOrderId(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!payment.getOrder().getUser().getEmail().equals(userEmail)
                || !payment.getRazorpayOrderId().equals(request.getRazorpayOrderId())) {
            return false;
        }

        String paymentId = request.getRazorpayPaymentId();

        // ---- Cash on Delivery selected inside Razorpay widget ----
        // Razorpay issues payment IDs starting with "cod_" for COD; no signature present.
        if (paymentId != null && paymentId.startsWith("cod_")) {
            payment.setRazorpayPaymentId(paymentId);
            payment.setPaymentMethod("COD");
            payment.setStatus("PENDING_COD");
            paymentRepository.save(payment);

            Order order = payment.getOrder();
            order.setStatus("COD_PLACED");
            orderRepository.save(order);

            return true;
        }

        // ---- Online payment: verify HMAC signature ----
        String generatedSignature =
                hmacSha256(
                        request.getRazorpayOrderId()
                                + "|"
                                + paymentId,
                        keySecret);

        if (!MessageDigest.isEqual(
                generatedSignature.getBytes(StandardCharsets.UTF_8),
                request.getRazorpaySignature()
                        .getBytes(StandardCharsets.UTF_8))) {

            return false;
        }

        payment.setRazorpayOrderId(request.getRazorpayOrderId());
        payment.setRazorpayPaymentId(paymentId);
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setPaymentMethod("RAZORPAY");
        payment.setStatus("PAID");

        paymentRepository.save(payment);

        Order order = payment.getOrder();
        order.setStatus("PAID");
        orderRepository.save(order);

        // CO5: Start background jobs after successful payment
        backgroundJobService.startOrderJobs(order.getOrderId());

        return true;
    }

    public void processWebhook(
            String payload,
            String signature) throws Exception {

        String generatedSignature =
                hmacSha256(payload, webhookSecret);

        if (!MessageDigest.isEqual(
                generatedSignature.getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8))) {

            throw new RuntimeException("Invalid webhook signature");
        }

        JSONObject json = new JSONObject(payload);

        String event = json.getString("event");

        if ("payment.captured".equals(event)) {

            JSONObject paymentEntity =
                    json.getJSONObject("payload")
                        .getJSONObject("payment")
                        .getJSONObject("entity");

            String razorpayPaymentId =
                    paymentEntity.getString("id");

            String razorpayOrderId =
                    paymentEntity.getString("order_id");

            Payment payment =
                    paymentRepository
                            .findByRazorpayOrderId(razorpayOrderId)
                            .orElse(null);

            if (payment == null) {
                return;
            }

            payment.setRazorpayPaymentId(razorpayPaymentId);
            payment.setStatus("PAID");

            paymentRepository.save(payment);

            Order order = payment.getOrder();

            if (!"PAID".equals(order.getStatus())) {
                order.setStatus("PAID");
                orderRepository.save(order);

                // CO5: Start background jobs after payment is confirmed via webhook
                backgroundJobService.startOrderJobs(order.getOrderId());
            }
        }
    }

    // -----------------------------------------------------------------------
    // Cash on Delivery
    // -----------------------------------------------------------------------

    public Map<String, Object> placeCodOrder(Long orderId, String userEmail) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Order not found");
        }

        Payment existing = paymentRepository.findByOrderOrderId(orderId).orElse(null);
        if (existing != null && "PAID".equals(existing.getStatus())) {
            throw new RuntimeException("Order is already paid");
        }

        Payment payment = (existing != null) ? existing : new Payment();
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentMethod("COD");
        payment.setStatus("PENDING_COD");

        paymentRepository.save(payment);

        order.setStatus("COD_PLACED");
        orderRepository.save(order);

        // CO5: Start background jobs (email confirmation, invoice, notification)
        backgroundJobService.startOrderJobs(order.getOrderId());

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", orderId);
        response.put("message", "Cash on Delivery order placed successfully");
        response.put("status", "PENDING_COD");

        return response;
    }

    // -----------------------------------------------------------------------
    // Utility
    // -----------------------------------------------------------------------

    private String hmacSha256(
            String data,
            String secret) throws Exception {

        Mac mac = Mac.getInstance("HmacSHA256");

        SecretKeySpec secretKey =
                new SecretKeySpec(
                        secret.getBytes(StandardCharsets.UTF_8),
                        "HmacSHA256");

        mac.init(secretKey);

        byte[] hash =
                mac.doFinal(
                        data.getBytes(StandardCharsets.UTF_8));

        StringBuilder result = new StringBuilder();

        for (byte b : hash) {
            result.append(
                    String.format("%02x", b));
        }

        return result.toString();
    }
}
