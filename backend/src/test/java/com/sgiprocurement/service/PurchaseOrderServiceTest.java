package com.sgiprocurement.service;

import com.sgiprocurement.dto.PurchaseOrderDTO;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderServiceTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private CostCalculatorService costCalculatorService;

    @InjectMocks
    private PurchaseOrderService purchaseOrderService;

    private PurchaseOrder po;
    private PurchaseOrderDTO poDTO;

    @BeforeEach
    void setUp() {
        po = new PurchaseOrder();
        po.setId(1L);
        po.setPosCode("ABC-VN-0001");
        po.setProductName("Test Product");
        po.setOrderedQty(100);
        po.setUnitPrice(new BigDecimal("10.00"));
        po.setStatus("DRAFT");

        poDTO = new PurchaseOrderDTO();
        poDTO.setPosCode("ABC-VN-0001");
        poDTO.setProductName("Test Product");
        poDTO.setOrderedQty(100);
        poDTO.setUnitPrice(new BigDecimal("10.00"));
        poDTO.setCurrency("USD");
        poDTO.setExchangeRate(BigDecimal.ONE);
    }

    @Test
    void getAllPurchaseOrders_shouldReturnAll() {
        when(purchaseOrderRepository.findAll()).thenReturn(List.of(po));

        List<PurchaseOrderDTO> result = purchaseOrderService.getAllPurchaseOrders();

        assertEquals(1, result.size());
    }

    @Test
    void getPurchaseOrderById_shouldReturn_whenExists() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));

        PurchaseOrderDTO result = purchaseOrderService.getPurchaseOrderById(1L);

        assertNotNull(result);
        assertEquals("ABC-VN-0001", result.getPosCode());
    }

    @Test
    void getPurchaseOrderById_shouldThrow_whenNotFound() {
        when(purchaseOrderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> purchaseOrderService.getPurchaseOrderById(99L));
    }

    @Test
    void getPurchaseOrdersByStatus_shouldFilterByStatus() {
        when(purchaseOrderRepository.findByStatus("DRAFT")).thenReturn(List.of(po));

        List<PurchaseOrderDTO> result = purchaseOrderService.getPurchaseOrdersByStatus("DRAFT");

        assertEquals(1, result.size());
    }

    @Test
    void createPurchaseOrder_shouldSetDefaultStatus() {
        doNothing().when(costCalculatorService).calculateCosts(any(PurchaseOrder.class));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> {
            PurchaseOrder saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        PurchaseOrderDTO result = purchaseOrderService.createPurchaseOrder(poDTO);

        assertNotNull(result);
        assertEquals("DRAFT", result.getStatus());
        assertNull(result.getPaymentStatus());
        verify(costCalculatorService).calculateCosts(any(PurchaseOrder.class));
    }

    @Test
    void approveL1_shouldApprove_whenDraft() {
        po.setStatus("DRAFT");
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseOrderDTO result = purchaseOrderService.approveL1(1L);

        assertEquals("APPROVED", result.getStatus());
    }

    @Test
    void approveL1_shouldThrow_whenNotDraft() {
        po.setStatus("APPROVED");
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));

        assertThrows(IllegalStateException.class, () -> purchaseOrderService.approveL1(1L));
    }

    @Test
    void approveL2_shouldApprove_whenDraft() {
        po.setStatus("DRAFT");
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseOrderDTO result = purchaseOrderService.approveL2(1L);

        assertEquals("APPROVED", result.getStatus());
    }

    @Test
    void approveL2_shouldThrow_whenInvalidStatus() {
        po.setStatus("COMPLETED");
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));

        assertThrows(IllegalStateException.class, () -> purchaseOrderService.approveL2(1L));
    }

    @Test
    void reject_shouldSetStatusToRejected() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseOrderDTO result = purchaseOrderService.reject(1L);

        assertEquals("REJECTED", result.getStatus());
    }

    @Test
    void updateStatus_shouldUpdateToGivenStatus() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PurchaseOrderDTO result = purchaseOrderService.updateStatus(1L, "IN_TRANSIT");

        assertEquals("IN_TRANSIT", result.getStatus());
    }

    @Test
    void updatePurchaseOrder_shouldUpdateFieldsAndRecalculate() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));
        doNothing().when(costCalculatorService).calculateCosts(any(PurchaseOrder.class));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        poDTO.setSupplierName("New Supplier");
        PurchaseOrderDTO result = purchaseOrderService.updatePurchaseOrder(1L, poDTO);

        assertEquals("New Supplier", result.getSupplierName());
        verify(costCalculatorService).calculateCosts(any(PurchaseOrder.class));
    }

    @Test
    void deletePurchaseOrder_shouldDelete_whenExists() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(po));

        purchaseOrderService.deletePurchaseOrder(1L);

        verify(purchaseOrderRepository).delete(po);
    }

    @Test
    void deletePurchaseOrder_shouldThrow_whenNotFound() {
        when(purchaseOrderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> purchaseOrderService.deletePurchaseOrder(99L));
    }
}
