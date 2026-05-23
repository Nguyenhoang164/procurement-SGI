package com.sgiprocurement.service;

import com.sgiprocurement.dto.ProductDTO;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.repository.ProductRepository;
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
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductNamingService productNamingService;

    @InjectMocks
    private ProductService productService;

    private Product product1;
    private Product product2;
    private ProductDTO productDTO;

    @BeforeEach
    void setUp() {
        product1 = new Product();
        product1.setId(1L);
        product1.setPosCode("ABC-VN-0001");
        product1.setProductName("Test Product A");
        product1.setMarketCode("VN");
        product1.setStatus("ACTIVE");

        product2 = new Product();
        product2.setId(2L);
        product2.setPosCode("XYZ-US-0001");
        product2.setProductName("Test Product B");
        product2.setMarketCode("US");
        product2.setStatus("ACTIVE");

        productDTO = new ProductDTO();
        productDTO.setProductName("New Product");
        productDTO.setMarketCode("VN");
        productDTO.setSpec("Spec");
        productDTO.setUnit("pcs");
        productDTO.setStatus("ACTIVE");
    }

    @Test
    void getAllProducts_shouldReturnAllProducts() {
        when(productRepository.findAll()).thenReturn(List.of(product1, product2));

        List<ProductDTO> result = productService.getAllProducts();

        assertEquals(2, result.size());
        assertEquals("ABC-VN-0001", result.get(0).getPosCode());
        assertEquals("XYZ-US-0001", result.get(1).getPosCode());
    }

    @Test
    void searchProducts_shouldReturnMatchingProducts() {
        when(productRepository.findByProductNameContainingIgnoreCase("Test")).thenReturn(List.of(product1, product2));

        List<ProductDTO> result = productService.searchProducts("Test");

        assertEquals(2, result.size());
    }

    @Test
    void getProductById_shouldReturnProduct_whenExists() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product1));

        ProductDTO result = productService.getProductById(1L);

        assertNotNull(result);
        assertEquals("ABC-VN-0001", result.getPosCode());
    }

    @Test
    void getProductById_shouldThrowException_whenNotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(99L));
    }

    @Test
    void createProduct_shouldGenerateCode_whenPosCodeIsEmpty() {
        when(productNamingService.generatePosCode("New Product", "VN")).thenReturn("NP-VN-0001");
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        ProductDTO result = productService.createProduct(productDTO);

        assertNotNull(result);
        verify(productNamingService).generatePosCode("New Product", "VN");
    }

    @Test
    void createProduct_shouldUseProvidedPosCode_whenNotEmpty() {
        productDTO.setPosCode("CUSTOM-VN-0001");
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        ProductDTO result = productService.createProduct(productDTO);

        assertNotNull(result);
        verify(productNamingService, never()).generatePosCode(anyString(), anyString());
    }

    @Test
    void updateProduct_shouldUpdateFields() {
        Product existing = new Product();
        existing.setId(1L);
        existing.setPosCode("OLD-VN-0001");
        existing.setProductName("Old Name");
        existing.setStatus("ACTIVE");

        ProductDTO updateDTO = new ProductDTO();
        updateDTO.setProductName("Updated Name");
        updateDTO.setSpec("Updated Spec");
        updateDTO.setMarketCode("US");
        updateDTO.setUnit("box");
        updateDTO.setStatus("INACTIVE");

        when(productRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProductDTO result = productService.updateProduct(1L, updateDTO);

        assertEquals("Updated Name", result.getProductName());
        assertEquals("Updated Spec", result.getSpec());
        assertEquals("US", result.getMarketCode());
        assertEquals("box", result.getUnit());
        assertEquals("INACTIVE", result.getStatus());
    }

    @Test
    void deleteProduct_shouldDelete_whenExists() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product1));

        productService.deleteProduct(1L);

        verify(productRepository).delete(product1);
    }

    @Test
    void deleteProduct_shouldThrowException_whenNotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.deleteProduct(99L));
    }

    @Test
    void generatePosCode_shouldDelegateToNamingService() {
        when(productNamingService.generatePosCode("ABC", "VN", 0)).thenReturn("ABC-VN-0001");

        String code = productService.generatePosCode("ABC", "VN");

        assertEquals("ABC-VN-0001", code);
    }
}
