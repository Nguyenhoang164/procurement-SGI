package com.sgiprocurement.controller;

import com.sgiprocurement.dto.ProductDTO;
import com.sgiprocurement.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @Test
    @WithMockUser
    void getAllProducts_shouldReturnList() throws Exception {
        ProductDTO dto = new ProductDTO(1L, "ABC-VN-0001", "Test", 1L, "VN", "spec", "pcs", "ACTIVE", null, null);
        when(productService.getAllProducts()).thenReturn(List.of(dto));

        mockMvc.perform(get("/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].posCode").value("ABC-VN-0001"))
                .andExpect(jsonPath("$[0].productName").value("Test"));
    }

    @Test
    @WithMockUser
    void searchProducts_shouldReturnResults() throws Exception {
        ProductDTO dto = new ProductDTO(1L, "ABC-VN-0001", "Test", 1L, "VN", "spec", "pcs", "ACTIVE", null, null);
        when(productService.searchProducts("Test")).thenReturn(List.of(dto));

        mockMvc.perform(get("/v1/products/search").param("query", "Test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].productName").value("Test"));
    }

    @Test
    @WithMockUser
    void getProductById_shouldReturnProduct() throws Exception {
        ProductDTO dto = new ProductDTO(1L, "ABC-VN-0001", "Test", 1L, "VN", "spec", "pcs", "ACTIVE", null, null);
        when(productService.getProductById(1L)).thenReturn(dto);

        mockMvc.perform(get("/v1/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser
    void createProduct_shouldReturn201() throws Exception {
        ProductDTO created = new ProductDTO(1L, "NP-VN-0001", "New Product", null, "VN", null, null, "ACTIVE", null, null);
        when(productService.createProduct(any(ProductDTO.class))).thenReturn(created);

        mockMvc.perform(post("/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productName\":\"New Product\",\"marketCode\":\"VN\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.posCode").value("NP-VN-0001"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateProduct_shouldReturnUpdated() throws Exception {
        ProductDTO updated = new ProductDTO(1L, "ABC-VN-0001", "Updated", 1L, "VN", "spec", "pcs", "ACTIVE", null, null);
        when(productService.updateProduct(eq(1L), any(ProductDTO.class))).thenReturn(updated);

        mockMvc.perform(put("/v1/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productName\":\"Updated\",\"marketCode\":\"VN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.productName").value("Updated"));
    }

    @Test
    @WithMockUser
    void deleteProduct_shouldReturn204() throws Exception {
        doNothing().when(productService).deleteProduct(1L);

        mockMvc.perform(delete("/v1/products/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void generateCode_shouldReturnCode() throws Exception {
        when(productService.generatePosCode("Test", "VN", 0)).thenReturn("TEST-VN-0001");

        mockMvc.perform(get("/v1/products/generate-code")
                        .param("productName", "Test")
                        .param("market", "VN"))
                .andExpect(status().isOk())
                .andExpect(content().string("TEST-VN-0001"));
    }
}
