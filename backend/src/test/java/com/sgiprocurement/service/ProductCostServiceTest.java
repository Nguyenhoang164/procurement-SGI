package com.sgiprocurement.service;

import com.sgiprocurement.dto.ProductCostDTO;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.model.PurchaseOrder;
import com.sgiprocurement.repository.ProductRepository;
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
class ProductCostServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductCostService productCostService;

    private Product product1;
    private Product product2;
    private Product productWithNoLots;
    private PurchaseOrder po;

    @BeforeEach
    void setUp() {
        product1 = new Product();
        product1.setId(1L);
        product1.setPosCode("ABC-VN-0001");
        product1.setProductName("Product A");
        product1.setLotCount(3);
        product1.setTotalQty(300);
        product1.setLatestUnitCostVnd(new BigDecimal("50000"));
        product1.setWeightedAvgCostVnd(new BigDecimal("45000"));

        product2 = new Product();
        product2.setId(2L);
        product2.setPosCode("XYZ-US-0001");
        product2.setProductName("Product B");
        product2.setLotCount(1);
        product2.setTotalQty(100);
        product2.setLatestUnitCostVnd(new BigDecimal("100000"));
        product2.setWeightedAvgCostVnd(new BigDecimal("95000"));

        productWithNoLots = new Product();
        productWithNoLots.setId(3L);
        productWithNoLots.setPosCode("NEW-VN-0001");
        productWithNoLots.setProductName("New Product");
        productWithNoLots.setLotCount(0);
        productWithNoLots.setTotalQty(0);

        po = new PurchaseOrder();
        po.setPosCode("ABC-VN-0001");
        po.setUnitCostFullVnd(new BigDecimal("55000.00"));
        po.setOrderedQty(100);
    }

    @Test
    void getAllProductCosts_shouldReturnOnlyProductsWithLots() {
        when(productRepository.findAll()).thenReturn(List.of(product1, product2, productWithNoLots));

        List<ProductCostDTO> result = productCostService.getAllProductCosts();

        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(dto -> dto.getLotCount() > 0));
    }

    @Test
    void getAllProductCosts_shouldBeSortedByPosCode() {
        when(productRepository.findAll()).thenReturn(List.of(product2, product1));

        List<ProductCostDTO> result = productCostService.getAllProductCosts();

        assertEquals("ABC-VN-0001", result.get(0).getPosCode());
        assertEquals("XYZ-US-0001", result.get(1).getPosCode());
    }

    @Test
    void applyReceiptFromPurchaseOrder_shouldUpdateWeightedAverage() {
        when(productRepository.findByPosCode("ABC-VN-0001")).thenReturn(Optional.of(product1));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productCostService.applyReceiptFromPurchaseOrder(po, 100);

        // New total qty = 300 + 100 = 400
        assertEquals(400, product1.getTotalQty());
        // New lot count = 3 + 1 = 4
        assertEquals(4, product1.getLotCount());
        // newAvg = (45000*300 + 55000*100) / 400 = (13500000 + 5500000) / 400 = 19000000 / 400 = 47500
        assertEquals(0, new BigDecimal("47500").compareTo(product1.getWeightedAvgCostVnd()));
        // latestUnitCost = 55000
        assertEquals(0, new BigDecimal("55000").compareTo(product1.getLatestUnitCostVnd()));
    }

    @Test
    void applyReceiptFromPurchaseOrder_shouldHandleNewProduct() {
        po.setPosCode("NEW-VN-0001");
        when(productRepository.findByPosCode("NEW-VN-0001")).thenReturn(Optional.of(productWithNoLots));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        productCostService.applyReceiptFromPurchaseOrder(po, 50);

        assertEquals(50, productWithNoLots.getTotalQty());
        assertEquals(1, productWithNoLots.getLotCount());
        // newAvg = lotUnitCost (since oldQty=0)
        assertEquals(0, new BigDecimal("55000").compareTo(productWithNoLots.getWeightedAvgCostVnd()));
    }

    @Test
    void applyReceiptFromPurchaseOrder_shouldReturn_whenPosCodeIsNull() {
        po.setPosCode(null);

        productCostService.applyReceiptFromPurchaseOrder(po, 100);

        verify(productRepository, never()).findByPosCode(anyString());
    }

    @Test
    void applyReceiptFromPurchaseOrder_shouldReturn_whenReceivedQtyIsZero() {
        productCostService.applyReceiptFromPurchaseOrder(po, 0);

        verify(productRepository, never()).findByPosCode(anyString());
    }

    @Test
    void applyReceiptFromPurchaseOrder_shouldThrow_whenProductNotFound() {
        when(productRepository.findByPosCode("NONEXISTENT")).thenReturn(Optional.empty());

        po.setPosCode("NONEXISTENT");

        assertThrows(IllegalStateException.class, () -> productCostService.applyReceiptFromPurchaseOrder(po, 100));
    }
}
