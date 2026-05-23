package com.sgiprocurement.controller;

import com.sgiprocurement.dto.PaymentRequestDTO;
import com.sgiprocurement.service.PaymentRequestService;
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
class PaymentRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentRequestService paymentRequestService;

    private PaymentRequestDTO createDTO() {
        PaymentRequestDTO dto = new PaymentRequestDTO();
        dto.setId(1L);
        dto.setPoId(1L);
        dto.setType("FULL_PAYMENT");
        dto.setAmountVnd(new BigDecimal("10000000"));
        dto.setStatus("PENDING_L1");
        return dto;
    }

    @Test
    @WithMockUser
    void getAllPaymentRequests_shouldReturnList() throws Exception {
        when(paymentRequestService.getAllPaymentRequests()).thenReturn(List.of(createDTO()));

        mockMvc.perform(get("/v1/payment-requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("FULL_PAYMENT"));
    }

    @Test
    @WithMockUser
    void getPaymentRequestById_shouldReturnRequest() throws Exception {
        when(paymentRequestService.getPaymentRequestById(1L)).thenReturn(createDTO());

        mockMvc.perform(get("/v1/payment-requests/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createPaymentRequest_shouldReturn201() throws Exception {
        when(paymentRequestService.createPaymentRequest(any(PaymentRequestDTO.class))).thenReturn(createDTO());

        mockMvc.perform(post("/v1/payment-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"poId\":1,\"type\":\"FULL_PAYMENT\",\"amountVnd\":10000000}"))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updatePaymentRequest_shouldReturnUpdated() throws Exception {
        when(paymentRequestService.updatePaymentRequest(eq(1L), any(PaymentRequestDTO.class))).thenReturn(createDTO());

        mockMvc.perform(put("/v1/payment-requests/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"poId\":1,\"type\":\"FULL_PAYMENT\",\"amountVnd\":10000000}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deletePaymentRequest_shouldReturn204() throws Exception {
        doNothing().when(paymentRequestService).deletePaymentRequest(1L);

        mockMvc.perform(delete("/v1/payment-requests/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void approveL1_shouldApprove() throws Exception {
        when(paymentRequestService.approveL1(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/payment-requests/1/approve-l1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void approveL2_shouldApprove() throws Exception {
        when(paymentRequestService.approveL2(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/payment-requests/1/approve-l2"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void reject_shouldReject() throws Exception {
        when(paymentRequestService.reject(eq(1L), any())).thenReturn(createDTO());

        mockMvc.perform(post("/v1/payment-requests/1/reject")
                        .param("reason", "Not needed"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void markAsPaid_shouldPay() throws Exception {
        when(paymentRequestService.markAsPaid(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/payment-requests/1/pay"))
                .andExpect(status().isOk());
    }
}
