package com.sgiprocurement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipment_trackings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "waybill_id", nullable = false)
    private Long waybillId;

    @Column(length = 200)
    private String location;

    @Column(name = "event_description", length = 500)
    private String eventDescription;

    @Column(name = "event_date")
    private LocalDateTime eventDate;

    @Column(length = 50)
    private String status;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

}
