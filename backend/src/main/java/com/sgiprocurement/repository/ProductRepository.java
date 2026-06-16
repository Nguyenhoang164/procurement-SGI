package com.sgiprocurement.repository;

import com.sgiprocurement.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByProductName(String productName);

    List<Product> findByProductNameContainingIgnoreCase(String productName);

    Optional<Product> findByPosCode(String posCode);

    List<Product> findByPosCodeIn(List<String> posCodes);

    long countByPosCodeStartingWith(String prefix);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.status = 'ACTIVE'")
    long countActiveProducts();

}
