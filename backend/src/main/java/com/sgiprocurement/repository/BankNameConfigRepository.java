package com.sgiprocurement.repository;

import com.sgiprocurement.model.BankNameConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BankNameConfigRepository extends JpaRepository<BankNameConfig, Long> {
    Optional<BankNameConfig> findByBankName(String bankName);
    boolean existsByBankName(String bankName);
}
