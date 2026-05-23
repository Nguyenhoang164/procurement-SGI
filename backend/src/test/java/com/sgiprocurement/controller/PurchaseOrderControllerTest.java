package com.sgiprocurement.controller;

import com.sgiprocurement.dto.PurchaseOrderDTO;
import com.sgiprocurement.service.PurchaseOrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PurchaseOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PurchaseOrderService purchaseOrderService;

    private PurchaseOrderDTO createDTO() {
        PurchaseOrderDTO dto = new PurchaseOrderDTO();
        dto.setId(1L);
        dto.setPosCode("ABC-VN-0001");
        dto.setProductName("Test Product");
        dto.setOrderedQty(100);
        dto.setUnitPrice(new BigDecimal("10.00"));
        dto.setStatus("DRAFT");
        return dto;
    }

    @Test
    @WithMockUser
    void getAllPurchaseOrders_shouldReturnList() throws Exception {
        when(purchaseOrderService.getAllPurchaseOrders()).thenReturn(List.of(createDTO()));

        mockMvc.perform(get("/v1/purchase-orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].posCode").value("ABC-VN-0001"));
    }

    @Test
    @WithMockUser
    void getPurchaseOrderById_shouldReturnOrder() throws Exception {
        when(purchaseOrderService.getPurchaseOrderById(1L)).thenReturn(createDTO());

        mockMvc.perform(get("/v1/purchase-orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createPurchaseOrder_shouldReturn201() throws Exception {
        when(purchaseOrderService.createPurchaseOrder(any(PurchaseOrderDTO.class))).thenReturn(createDTO());

        mockMvc.perform(post("/v1/purchase-orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"posCode\":\"ABC-VN-0001\",\"orderedQty\":100,\"unitPrice\":10.00}"))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updatePurchaseOrder_shouldReturnUpdated() throws Exception {
        when(purchaseOrderService.updatePurchaseOrder(eq(1L), any(PurchaseOrderDTO.class))).thenReturn(createDTO());

        mockMvc.perform(put("/v1/purchase-orders/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"posCode\":\"ABC-VN-0001\",\"orderedQty\":100,\"unitPrice\":10.00}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deletePurchaseOrder_shouldReturn204() throws Exception {
        doNothing().when(purchaseOrderService).deletePurchaseOrder(1L);

        mockMvc.perform(delete("/v1/purchase-orders/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void approveL1_shouldApprove() throws Exception {
        when(purchaseOrderService.approveL1(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/purchase-orders/1/approve-l1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void approveL2_shouldApprove() throws Exception {
        when(purchaseOrderService.approveL2(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/purchase-orders/1/approve-l2"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void reject_shouldReject() throws Exception {
        when(purchaseOrderService.reject(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/purchase-orders/1/reject"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updateStatus_shouldUpdate() throws Exception {
        when(purchaseOrderService.updateStatus(1L, "IN_TRANSIT")).thenReturn(createDTO());

        mockMvc.perform(post("/v1/purchase-orders/1/status")
                        .param("status", "IN_TRANSIT"))
                .andExpect(status().isOk());
    }
}
