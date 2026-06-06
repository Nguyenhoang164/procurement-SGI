package com.sgiprocurement.repository;

import com.sgiprocurement.model.WarehouseReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WarehouseReceiptItemRepository extends JpaRepository<WarehouseReceiptItem, Long> {
    List<WarehouseReceiptItem> findByReceiptId(Long receiptId);
}
