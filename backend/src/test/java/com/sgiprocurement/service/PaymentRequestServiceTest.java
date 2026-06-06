package com.sgiprocurement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgiprocurement.dto.PaymentRequestDTO;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.model.PaymentRequest;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.Waybill;
import com.sgiprocurement.repository.*;
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

import org.mockito.Mockito;

@ExtendWith(MockitoExtension.class)
class PaymentRequestServiceTest {

    @Mock
    private PaymentRequestRepository paymentRequestRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private WaybillRepository waybillRepository;

    @Mock
    private PaymentRequestPurchaseOrderRepository paymentRequestPurchaseOrderRepository;

    @Mock
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Mock
    private PaymentRequestWaybillRepository paymentRequestWaybillRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private WarehouseReceiptRepository warehouseReceiptRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @InjectMocks
    private PaymentRequestService paymentRequestService;

    private PurchaseOrder approvedPO;
    private PurchaseOrder draftPO;
    private PaymentRequest paymentRequest;
    private PaymentRequestDTO paymentRequestDTO;

    @BeforeEach
    void setUp() {
        approvedPO = new PurchaseOrder();
        approvedPO.setId(1L);
        approvedPO.setPosCode("ABC-VN-0001");
        approvedPO.setStatus("APPROVED");
        approvedPO.setPaymentStatus(null);

        draftPO = new PurchaseOrder();
        draftPO.setId(2L);
        draftPO.setPosCode("XYZ-US-0001");
        draftPO.setStatus("DRAFT");

        paymentRequest = new PaymentRequest();
        paymentRequest.setId(1L);
        paymentRequest.setPoId(1L);
        paymentRequest.setType("FULL_PAYMENT");
        paymentRequest.setAmountVnd(new BigDecimal("10000000"));
        paymentRequest.setStatus("PENDING_L1");

        paymentRequestDTO = new PaymentRequestDTO();
        paymentRequestDTO.setPoId(1L);
        paymentRequestDTO.setType("FULL_PAYMENT");
        paymentRequestDTO.setAmountVnd(new BigDecimal("10000000"));

        Mockito.lenient().when(paymentRequestPurchaseOrderRepository.findByPaymentRequestId(any())).thenReturn(List.of());
        Mockito.lenient().when(paymentRequestWaybillRepository.findByPaymentRequestId(any())).thenReturn(List.of());
        Mockito.lenient().when(waybillRepository.findByPaymentRequestId(any())).thenReturn(List.of());
        Mockito.lenient().when(warehouseReceiptRepository.findAllByPoId(any())).thenReturn(List.of());
        Mockito.lenient().when(warehouseReceiptRepository.findAllByWaybillId(any())).thenReturn(List.of());
    }

    @Test
    void getAllPaymentRequests_shouldReturnAll() {
        when(paymentRequestRepository.findAll()).thenReturn(List.of(paymentRequest));

        List<PaymentRequestDTO> result = paymentRequestService.getAllPaymentRequests();

        assertEquals(1, result.size());
    }

    @Test
    void getPaymentRequestById_shouldReturn_whenExists() {
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));

        PaymentRequestDTO result = paymentRequestService.getPaymentRequestById(1L);

        assertNotNull(result);
    }

    @Test
    void getPaymentRequestById_shouldThrow_whenNotFound() {
        when(paymentRequestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentRequestService.getPaymentRequestById(99L));
    }

    @Test
    void getPaymentRequestsByPoId_shouldReturnByPoId() {
        when(paymentRequestRepository.findByPoId(1L)).thenReturn(List.of(paymentRequest));

        List<PaymentRequestDTO> result = paymentRequestService.getPaymentRequestsByPoId(1L);

        assertEquals(1, result.size());
    }

    @Test
    void getPaymentRequestsByStatus_shouldFilterByStatus() {
        when(paymentRequestRepository.findByStatus("PENDING_L1")).thenReturn(List.of(paymentRequest));

        List<PaymentRequestDTO> result = paymentRequestService.getPaymentRequestsByStatus("PENDING_L1");

        assertEquals(1, result.size());
    }

    @Test
    void createPaymentRequest_shouldCreate_whenPOIsApproved() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(approvedPO));
        when(paymentRequestRepository.save(any(PaymentRequest.class))).thenAnswer(invocation -> {
            PaymentRequest saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        when(paymentRequestPurchaseOrderRepository.findByPaymentRequestId(any())).thenReturn(List.of());

        PaymentRequestDTO result = paymentRequestService.createPaymentRequest(paymentRequestDTO);

        assertNotNull(result);
        assertEquals("PENDING_L1", result.getStatus());
    }

    @Test
    void createPaymentRequest_shouldThrow_whenPOIsNotApproved() {
        when(purchaseOrderRepository.findById(2L)).thenReturn(Optional.of(draftPO));

        PaymentRequestDTO dto = new PaymentRequestDTO();
        dto.setPoId(2L);

        assertThrows(IllegalStateException.class, () -> paymentRequestService.createPaymentRequest(dto));
    }

    @Test
    void approveL1_shouldSetAccountingCheck() {
        paymentRequest.setStatus("PENDING_L1");
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));
        when(paymentRequestRepository.save(any(PaymentRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(approvedPO));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRequestPurchaseOrderRepository.findByPaymentRequestId(1L)).thenReturn(List.of());

        PaymentRequestDTO result = paymentRequestService.approveL1(1L);

        assertEquals("ACCOUNTING_CHECK", result.getStatus());
    }

    @Test
    void approveL1_shouldThrow_whenNotPendingL1() {
        paymentRequest.setStatus("DRAFT");
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));

        assertThrows(IllegalStateException.class, () -> paymentRequestService.approveL1(1L));
    }

    @Test
    void approveL2_shouldSetApproved() {
        paymentRequest.setStatus("PENDING_L2");
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));
        when(paymentRequestRepository.save(any(PaymentRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(approvedPO));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequestDTO result = paymentRequestService.approveL2(1L);

        assertEquals("APPROVED", result.getStatus());
    }

    @Test
    void approveL2_shouldThrow_whenNotPendingL2() {
        paymentRequest.setStatus("PENDING_L1");
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));

        assertThrows(IllegalStateException.class, () -> paymentRequestService.approveL2(1L));
    }

    @Test
    void reject_shouldSetRejected() {
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));
        when(paymentRequestRepository.save(any(PaymentRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(approvedPO));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequestDTO result = paymentRequestService.reject(1L, "Not needed", null);

        assertEquals("REJECTED", result.getStatus());
    }

    @Test
    void reject_shouldSetRejected_withoutReason() {
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));
        when(paymentRequestRepository.save(any(PaymentRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(approvedPO));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequestDTO result = paymentRequestService.reject(1L, null, null);

        assertEquals("REJECTED", result.getStatus());
    }

    @Test
    void markAsPaid_shouldSetPaid_whenApproved() throws Exception {
        paymentRequest.setStatus("APPROVED");
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(approvedPO));
        when(paymentRequestRepository.save(any(PaymentRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRequestPurchaseOrderRepository.findByPaymentRequestId(1L)).thenReturn(List.of());
        when(purchaseOrderItemRepository.findByPurchaseOrderId(1L)).thenReturn(List.of());
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(waybillRepository.save(any(Waybill.class))).thenAnswer(invocation -> {
            Waybill wb = invocation.getArgument(0);
            wb.setId(1L);
            return wb;
        });
        when(paymentRequestWaybillRepository.save(any())).thenReturn(null);

        PaymentRequestDTO result = paymentRequestService.markAsPaid(1L, null, null);

        assertEquals("PAID", result.getStatus());
    }

    @Test
    void markAsPaid_shouldThrow_whenNotApproved() {
        paymentRequest.setStatus("PENDING_L1");
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));

        assertThrows(IllegalStateException.class, () -> paymentRequestService.markAsPaid(1L, null, null));
    }

    @Test
    void updatePaymentRequest_shouldUpdateFields() {
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));
        when(paymentRequestRepository.save(any(PaymentRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequestDTO dto = new PaymentRequestDTO();
        dto.setPoId(1L);
        dto.setType("DEPOSIT");
        dto.setAmountVnd(new BigDecimal("5000000"));
        dto.setNote("Updated note");

        PaymentRequestDTO result = paymentRequestService.updatePaymentRequest(1L, dto);

        assertEquals("DEPOSIT", result.getType());
        assertEquals(0, new BigDecimal("5000000").compareTo(result.getAmountVnd()));
    }

    @Test
    void deletePaymentRequest_shouldDelete_whenExists() {
        when(paymentRequestRepository.findById(1L)).thenReturn(Optional.of(paymentRequest));

        paymentRequestService.deletePaymentRequest(1L);

        verify(paymentRequestRepository).delete(paymentRequest);
    }

    @Test
    void deletePaymentRequest_shouldThrow_whenNotFound() {
        when(paymentRequestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentRequestService.deletePaymentRequest(99L));
    }

}
