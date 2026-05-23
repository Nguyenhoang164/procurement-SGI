package com.sgiprocurement.service;

import com.sgiprocurement.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductNamingServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductNamingService productNamingService;

    @Test
    void generatePosCode_shouldGenerateCorrectFormat() {
        when(productRepository.countByPosCodeStartingWith("DP-VN-")).thenReturn(0L);

        String code = productNamingService.generatePosCode("Durex Pro", "VN", 0);

        assertEquals("DP-VN-0001", code);
    }

    @Test
    void generatePosCode_shouldIncrementSequence() {
        when(productRepository.countByPosCodeStartingWith("A-VN-")).thenReturn(5L);

        String code = productNamingService.generatePosCode("ABC", "VN", 0);

        assertEquals("A-VN-0006", code);
    }

    @Test
    void generatePosCode_shouldHandleIteration() {
        when(productRepository.countByPosCodeStartingWith("T-US-")).thenReturn(0L);

        String code = productNamingService.generatePosCode("Test", "US", 3);

        assertEquals("T-US-0004", code);
    }

    @Test
    void generatePosCode_shouldDefaultMarketToXX() {
        when(productRepository.countByPosCodeStartingWith("P-XX-")).thenReturn(0L);

        String code = productNamingService.generatePosCode("Product", null, 0);

        assertEquals("P-XX-0001", code);
    }

    @Test
    void generatePosCode_shouldDefaultMarketToXX_whenEmpty() {
        when(productRepository.countByPosCodeStartingWith("P-XX-")).thenReturn(0L);

        String code = productNamingService.generatePosCode("Product", "", 0);

        assertEquals("P-XX-0001", code);
    }

    @Test
    void generateAbbreviation_shouldUseFirstLetters() {
        when(productRepository.countByPosCodeStartingWith("DP-VN-")).thenReturn(0L);

        String code = productNamingService.generatePosCode("Durex Pro", "VN");

        assertEquals("DP-VN-0001", code);
    }

    @Test
    void generateAbbreviation_shouldDefaultToPROD_whenNameIsEmpty() {
        when(productRepository.countByPosCodeStartingWith("PROD-VN-")).thenReturn(0L);

        String code = productNamingService.generatePosCode("", "VN");

        assertEquals("PROD-VN-0001", code);
    }

    @Test
    void generateAbbreviation_shouldDefaultToPROD_whenNameIsNull() {
        when(productRepository.countByPosCodeStartingWith("PROD-VN-")).thenReturn(0L);

        String code = productNamingService.generatePosCode(null, "VN");

        assertEquals("PROD-VN-0001", code);
    }
}
