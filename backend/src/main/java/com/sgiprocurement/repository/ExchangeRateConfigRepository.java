package com.sgiprocurement.repository;

import com.sgiprocurement.model.ExchangeRateConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExchangeRateConfigRepository extends JpaRepository<ExchangeRateConfig, Long> {
    Optional<ExchangeRateConfig> findByCurrency(String currency);
}
