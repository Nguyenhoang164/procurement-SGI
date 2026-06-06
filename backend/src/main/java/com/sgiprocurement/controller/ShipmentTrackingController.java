package com.sgiprocurement.controller;

import com.sgiprocurement.dto.ShipmentTrackingDTO;
import com.sgiprocurement.service.ShipmentTrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/v1/shipment-trackings")
@CrossOrigin(origins = "http://localhost:3000")
public class ShipmentTrackingController {

    @Autowired
    private ShipmentTrackingService shipmentTrackingService;

    @GetMapping("/waybill/{waybillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<List<ShipmentTrackingDTO>> getByWaybillId(@PathVariable Long waybillId) {
        return ResponseEntity.ok(shipmentTrackingService.getTrackingsByWaybillId(waybillId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    public ResponseEntity<ShipmentTrackingDTO> createTracking(@Valid @RequestBody ShipmentTrackingDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shipmentTrackingService.createTracking(dto));
    }

}
