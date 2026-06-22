package com.sgiprocurement.controller;

import com.sgiprocurement.dto.ProductCostDTO;
import com.sgiprocurement.service.ProductCostService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductCostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductCostService productCostService;

    @Test
    @WithMockUser
    void getAllProductCosts_shouldReturnList() throws Exception {
        ProductCostDTO dto = new ProductCostDTO("ABC-VN-0001", "Product A", 3, 300,
                new BigDecimal("50000"), new BigDecimal("45000"), new BigDecimal("5000"));
        when(productCostService.getAllProductCosts(null, null, null)).thenReturn(List.of(dto));

        mockMvc.perform(get("/v1/product-costs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].posCode").value("ABC-VN-0001"))
                .andExpect(jsonPath("$[0].lotCount").value(3));
    }
}
