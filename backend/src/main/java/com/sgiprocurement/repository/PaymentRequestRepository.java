package com.sgiprocurement.repository;

import com.sgiprocurement.model.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {

    List<PaymentRequest> findByPoId(Long poId);

    List<PaymentRequest> findByStatus(String status);

    @Query("SELECT pr FROM PaymentRequest pr WHERE CAST(pr.id AS string) LIKE %:keyword% OR pr.note LIKE %:keyword%")
    List<PaymentRequest> searchByKeyword(@Param("keyword") String keyword);

}
