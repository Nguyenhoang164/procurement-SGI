package com.sgiprocurement.repository;

import com.sgiprocurement.model.ShipmentTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShipmentTrackingRepository extends JpaRepository<ShipmentTracking, Long> {

    List<ShipmentTracking> findByWaybillIdOrderByEventDateDesc(Long waybillId);

}
