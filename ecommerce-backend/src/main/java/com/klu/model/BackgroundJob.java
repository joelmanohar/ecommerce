package com.klu.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "background_jobs")
public class BackgroundJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long jobId;

    private Long orderId;
    private String jobType;
    private String status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getJobId() { return jobId; }
    public Long getOrderId() { return orderId; }
    public String getJobType() { return jobType; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    public void setStatus(String status) { this.status = status; }
    public void setMessage(String message) { this.message = message; }
}
