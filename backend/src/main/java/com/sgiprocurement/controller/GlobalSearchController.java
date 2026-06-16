package com.sgiprocurement.controller;

import com.sgiprocurement.dto.PurchaseOrderDTO;
import com.sgiprocurement.dto.PaymentRequestDTO;
import com.sgiprocurement.dto.WaybillDTO;
import com.sgiprocurement.dto.WeeklyPlanDTO;
import com.sgiprocurement.service.PurchaseOrderService;
import com.sgiprocurement.service.PaymentRequestService;
import com.sgiprocurement.service.WaybillService;
import com.sgiprocurement.service.WeeklyPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/v1/search")
@CrossOrigin(origins = "http://localhost:3000")
public class GlobalSearchController {

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private PaymentRequestService paymentRequestService;

    @Autowired
    private WaybillService waybillService;

    @Autowired
    private WeeklyPlanService weeklyPlanService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<Map<String, Object>> globalSearch(@RequestParam String keyword) {
        Map<String, Object> results = new LinkedHashMap<>();

        List<WeeklyPlanDTO> weeklyPlans = weeklyPlanService.searchByKeyword(keyword);
        results.put("weeklyPlans", weeklyPlans);

        List<PurchaseOrderDTO> pos = purchaseOrderService.searchByKeyword(keyword, null, null, null);
        results.put("purchaseOrders", pos);

        List<PaymentRequestDTO> paymentRequests = paymentRequestService.searchPaymentRequests(keyword);
        results.put("paymentRequests", paymentRequests);

        List<WaybillDTO> waybills = waybillService.searchByCode(keyword);
        results.put("waybills", waybills);

        return ResponseEntity.ok(results);
    }

}
