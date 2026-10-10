package com.klu.service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.klu.model.BackgroundJob;
import com.klu.model.Order;
import com.klu.repository.BackgroundJobRepository;
import com.klu.repository.OrderRepository;

@Service
public class BackgroundJobProcessor {

    private static final Logger log = LoggerFactory.getLogger(BackgroundJobProcessor.class);

    private final BackgroundJobRepository jobRepository;
    private final JobNotificationService notifier;
    private final JavaMailSender mailSender;
    private final OrderRepository orderRepository;

    @Value("${smartcart.mail.from}")
    private String mailFrom;

    public BackgroundJobProcessor(
        BackgroundJobRepository jobRepository,
        JobNotificationService notifier,
        JavaMailSender mailSender,
        OrderRepository orderRepository) {

        this.jobRepository = jobRepository;
        this.notifier = notifier;
        this.mailSender = mailSender;
        this.orderRepository = orderRepository;
    }

    @Async("taskExecutor")
    public void process(Long jobId) {

        BackgroundJob job =
            jobRepository.findById(jobId).orElseThrow();

        try {
            update(job, "PROCESSING", "Task started");
            log.info("Processing background job #{} (type={}, orderId={})", jobId, job.getJobType(), job.getOrderId());

            switch (job.getJobType()) {
                case "EMAIL" -> sendOrderEmail(job);
                case "INVOICE" -> generateInvoice(job);
                case "NOTIFICATION" -> sendNotification(job);
                default -> throw new RuntimeException("Unknown job type: " + job.getJobType());
            }

            update(job, "COMPLETED", "Task completed successfully");
            log.info("Background job #{} completed successfully", jobId);

        } catch (Exception e) {
            log.error("Background job #{} failed: {}", jobId, e.getMessage(), e);
            update(job, "FAILED", e.getMessage());
        }
    }

    @Transactional
    public void update(
        BackgroundJob job,
        String status,
        String message) {

        job.setStatus(status);
        job.setMessage(message);
        jobRepository.save(job);
        notifier.publish(job);
    }

    private void sendOrderEmail(BackgroundJob job) {

        Order order = orderRepository.findById(job.getOrderId())
            .orElseThrow(() -> new RuntimeException("Order not found: " + job.getOrderId()));

        String customerEmail = order.getUser().getEmail();
        log.info("Sending order confirmation email to {} for order #{}", customerEmail, order.getOrderId());

        SimpleMailMessage mail = new SimpleMailMessage();

        mail.setFrom(mailFrom);
        mail.setTo(customerEmail);
        mail.setSubject("SmartCart Order Confirmation - Order #" + order.getOrderId());

        String customerName = (order.getUser().getName() != null && !order.getUser().getName().isBlank())
            ? order.getUser().getName()
            : "Customer";

        mail.setText(
            "Dear " + customerName + ",\n\n"
            + "Your order #" + order.getOrderId()
            + " has been placed successfully.\n"
            + "Total Amount: ₹" + order.getTotalAmount() + "\n"
            + "Order Status: " + order.getStatus() + "\n\n"
            + "Thank you for shopping with SmartCart!"
        );

        mailSender.send(mail);
        log.info("Order confirmation email sent successfully to {} for order #{}", customerEmail, order.getOrderId());
    }

    private void generateInvoice(BackgroundJob job) {
        try {
            Path folder = Paths.get("invoices");
            Files.createDirectories(folder);

            String html = """
            <html>
            <body>
            <h1>SmartCart Invoice</h1>
            <p>Order ID: %d</p>
            <p>Payment: Successful</p>
            <p>Thank you for shopping with SmartCart!</p>
            </body>
            </html>
            """.formatted(job.getOrderId());

            Files.writeString(
                folder.resolve(
                    "invoice-" + job.getOrderId() + ".html"
                ),
                html,
                StandardCharsets.UTF_8
            );

        } catch (Exception e) {
            throw new RuntimeException(
                "Invoice generation failed", e
            );
        }
    }

    private void sendNotification(BackgroundJob job) {
        System.out.println(
            "SmartCart notification: Order "
            + job.getOrderId()
            + " payment confirmed"
        );
    }
}
