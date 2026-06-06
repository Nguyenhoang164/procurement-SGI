package com.sgiprocurement.repository;

import com.sgiprocurement.model.TradeRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeRouteRepository extends JpaRepository<TradeRoute, Long> {
    List<TradeRoute> findByActiveTrueOrderByRouteName();
}
