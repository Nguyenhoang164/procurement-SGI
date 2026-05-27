package com.sgiprocurement.service;

import com.sgiprocurement.model.ShipmentTracking;
import com.sgiprocurement.dto.ShipmentTrackingDTO;
import com.sgiprocurement.repository.ShipmentTrackingRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ShipmentTrackingService {

    @Autowired
    private ShipmentTrackingRepository shipmentTrackingRepository;

    public List<ShipmentTrackingDTO> getTrackingsByWaybillId(Long waybillId) {
        return shipmentTrackingRepository.findByWaybillIdOrderByEventDateDesc(waybillId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ShipmentTrackingDTO createTracking(ShipmentTrackingDTO dto) {
        ShipmentTracking tracking = new ShipmentTracking();
        tracking.setWaybillId(dto.getWaybillId());
        tracking.setLocation(dto.getLocation());
        tracking.setEventDescription(dto.getEventDescription());
        tracking.setEventDate(dto.getEventDate() != null ? dto.getEventDate() : LocalDateTime.now());
        tracking.setStatus(dto.getStatus());
        tracking.setUpdatedBy(dto.getUpdatedBy());
        ShipmentTracking saved = shipmentTrackingRepository.save(tracking);
        return convertToDTO(saved);
    }

    private ShipmentTrackingDTO convertToDTO(ShipmentTracking tracking) {
        return new ShipmentTrackingDTO(
                tracking.getId(),
                tracking.getWaybillId(),
                tracking.getLocation(),
                tracking.getEventDescription(),
                tracking.getEventDate(),
                tracking.getStatus(),
                tracking.getUpdatedBy(),
                tracking.getCreatedAt()
        );
    }

}
