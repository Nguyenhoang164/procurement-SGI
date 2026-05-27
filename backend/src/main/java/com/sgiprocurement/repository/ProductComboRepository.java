package com.sgiprocurement.repository;

import com.sgiprocurement.model.ProductCombo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductComboRepository extends JpaRepository<ProductCombo, Long> {
    List<ProductCombo> findByProductIdOrderByIdAsc(Long productId);
    boolean existsByComboCode(String comboCode);
    void deleteByProductId(Long productId);
}
