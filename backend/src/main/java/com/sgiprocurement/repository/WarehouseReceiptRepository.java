package com.sgiprocurement.repository;

import com.sgiprocurement.model.WarehouseReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WarehouseReceiptRepository extends JpaRepository<WarehouseReceipt, Long> {

    Optional<WarehouseReceipt> findByPoId(Long poId);

}
