package com.sgiprocurement.service;

import com.sgiprocurement.dto.PendingReceiveDTO;
import com.sgiprocurement.dto.WarehouseReceiptDTO;
import com.sgiprocurement.dto.WarehouseReceiveRequest;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.model.WarehouseReceipt;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.repository.PurchaseOrderRepository;
import com.sgiprocurement.repository.WarehouseReceiptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WarehouseReceiptServiceTest {

    @Mock
    private WarehouseReceiptRepository warehouseReceiptRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductCostService productCostService;

    @InjectMocks
    private WarehouseReceiptService warehouseReceiptService;

    private PurchaseOrder paidPO;
    private PurchaseOrder notPaidPO;
    private Product product;
    private WarehouseReceipt receipt;
    private WarehouseReceiveRequest receiveRequest;

    @BeforeEach
    void setUp() {
        paidPO = new PurchaseOrder();
        paidPO.setId(1L);
        paidPO.setPosCode("ABC-VN-0001");
        paidPO.setOrderedQty(100);
        paidPO.setStatus("IN_TRANSIT");
        paidPO.setPaymentStatus("PAID");

        notPaidPO = new PurchaseOrder();
        notPaidPO.setId(2L);
        notPaidPO.setPosCode("XYZ-US-0001");
        notPaidPO.setOrderedQty(50);
        notPaidPO.setStatus("APPROVED");
        notPaidPO.setPaymentStatus("PENDING");

        product = new Product();
        product.setId(1L);
        product.setPosCode("ABC-VN-0001");
        product.setProductName("Test Product");

        receipt = new WarehouseReceipt();
        receipt.setId(1L);
        receipt.setPoId(1L);
        receipt.setReceivedQty(100);
        receipt.setStatus("RECEIVED");

        receiveRequest = new WarehouseReceiveRequest();
        receiveRequest.setPoId(1L);
        receiveRequest.setReceivedQty(100);
        receiveRequest.setInspector("Inspector A");
        receiveRequest.setConditionDescription("Good condition");
    }

    @Test
    void getPendingReceives_shouldReturnOnlyPaidInTransitWithoutReceipt() {
        when(purchaseOrderRepository.findByPaymentStatus("PAID")).thenReturn(List.of(paidPO));
        when(warehouseReceiptRepository.existsByPoId(1L)).thenReturn(false);
        when(productRepository.findByPosCode("ABC-VN-0001")).thenReturn(Optional.of(product));

        List<PendingReceiveDTO> result = warehouseReceiptService.getPendingReceives();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getPoId());
    }

    @Test
    void getPendingReceives_shouldExcludePOsWithExistingReceipt() {
        when(purchaseOrderRepository.findByPaymentStatus("PAID")).thenReturn(List.of(paidPO));
        when(warehouseReceiptRepository.existsByPoId(1L)).thenReturn(true);

        List<PendingReceiveDTO> result = warehouseReceiptService.getPendingReceives();

        assertTrue(result.isEmpty());
    }

    @Test
    void receiveGoods_shouldCreateReceiptAndUpdatePO() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(paidPO));
        when(warehouseReceiptRepository.existsByPoId(1L)).thenReturn(false);
        when(warehouseReceiptRepository.save(any(WarehouseReceipt.class))).thenAnswer(invocation -> {
            WarehouseReceipt saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(productCostService).applyReceiptFromPurchaseOrder(any(PurchaseOrder.class), anyInt());

        WarehouseReceiptDTO result = warehouseReceiptService.receiveGoods(receiveRequest);

        assertNotNull(result);
        assertEquals(100, result.getReceivedQty());
        assertEquals("RECEIVED", result.getStatus());
        assertEquals("COMPLETED", paidPO.getStatus());
        verify(productCostService).applyReceiptFromPurchaseOrder(paidPO, 100);
    }

    @Test
    void receiveGoods_shouldThrow_whenPOIsNotPaid() {
        when(purchaseOrderRepository.findById(2L)).thenReturn(Optional.of(notPaidPO));

        WarehouseReceiveRequest request = new WarehouseReceiveRequest();
        request.setPoId(2L);
        request.setReceivedQty(50);

        assertThrows(IllegalStateException.class, () -> warehouseReceiptService.receiveGoods(request));
    }

    @Test
    void receiveGoods_shouldThrow_whenReceiptAlreadyExists() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(paidPO));
        when(warehouseReceiptRepository.existsByPoId(1L)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> warehouseReceiptService.receiveGoods(receiveRequest));
    }

    @Test
    void receiveGoods_shouldThrow_whenQtyExceedsOrdered() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(paidPO));
        when(warehouseReceiptRepository.existsByPoId(1L)).thenReturn(false);

        receiveRequest.setReceivedQty(200);

        assertThrows(IllegalArgumentException.class, () -> warehouseReceiptService.receiveGoods(receiveRequest));
    }

    @Test
    void getAllWarehouseReceipts_shouldReturnAll() {
        when(warehouseReceiptRepository.findAll()).thenReturn(List.of(receipt));

        List<WarehouseReceiptDTO> result = warehouseReceiptService.getAllWarehouseReceipts();

        assertEquals(1, result.size());
    }

    @Test
    void getWarehouseReceiptById_shouldReturn_whenExists() {
        when(warehouseReceiptRepository.findById(1L)).thenReturn(Optional.of(receipt));

        WarehouseReceiptDTO result = warehouseReceiptService.getWarehouseReceiptById(1L);

        assertNotNull(result);
    }

    @Test
    void getWarehouseReceiptById_shouldThrow_whenNotFound() {
        when(warehouseReceiptRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> warehouseReceiptService.getWarehouseReceiptById(99L));
    }

    @Test
    void getWarehouseReceiptByPoId_shouldReturn_whenExists() {
        when(warehouseReceiptRepository.findByPoId(1L)).thenReturn(Optional.of(receipt));

        WarehouseReceiptDTO result = warehouseReceiptService.getWarehouseReceiptByPoId(1L);

        assertNotNull(result);
    }

    @Test
    void createWarehouseReceipt_shouldDelegateToReceiveGoods() {
        when(purchaseOrderRepository.findById(1L)).thenReturn(Optional.of(paidPO));
        when(warehouseReceiptRepository.existsByPoId(1L)).thenReturn(false);
        when(warehouseReceiptRepository.save(any(WarehouseReceipt.class))).thenAnswer(invocation -> {
            WarehouseReceipt saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(productCostService).applyReceiptFromPurchaseOrder(any(PurchaseOrder.class), anyInt());

        WarehouseReceiptDTO dto = new WarehouseReceiptDTO();
        dto.setPoId(1L);
        dto.setReceivedQty(100);
        dto.setInspector("Inspector A");
        dto.setCondition("Good");

        WarehouseReceiptDTO result = warehouseReceiptService.createWarehouseReceipt(dto);

        assertNotNull(result);
    }

    @Test
    void updateWarehouseReceipt_shouldUpdateFields() {
        when(warehouseReceiptRepository.findById(1L)).thenReturn(Optional.of(receipt));
        when(warehouseReceiptRepository.save(any(WarehouseReceipt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WarehouseReceiptDTO dto = new WarehouseReceiptDTO();
        dto.setReceivedQty(80);
        dto.setInspector("Inspector B");
        dto.setCondition("Fair");

        WarehouseReceiptDTO result = warehouseReceiptService.updateWarehouseReceipt(1L, dto);

        assertEquals(80, result.getReceivedQty());
        assertEquals("Inspector B", result.getInspector());
    }

    @Test
    void deleteWarehouseReceipt_shouldDelete_whenExists() {
        when(warehouseReceiptRepository.findById(1L)).thenReturn(Optional.of(receipt));

        warehouseReceiptService.deleteWarehouseReceipt(1L);

        verify(warehouseReceiptRepository).delete(receipt);
    }

    @Test
    void deleteWarehouseReceipt_shouldThrow_whenNotFound() {
        when(warehouseReceiptRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> warehouseReceiptService.deleteWarehouseReceipt(99L));
    }
}
