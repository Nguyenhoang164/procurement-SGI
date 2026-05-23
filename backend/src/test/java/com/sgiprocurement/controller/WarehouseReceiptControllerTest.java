package com.sgiprocurement.controller;

import com.sgiprocurement.dto.PendingReceiveDTO;
import com.sgiprocurement.dto.WarehouseReceiptDTO;
import com.sgiprocurement.service.WarehouseReceiptService;
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
class WarehouseReceiptControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WarehouseReceiptService warehouseReceiptService;

    @Test
    @WithMockUser
    void getPendingReceives_shouldReturnList() throws Exception {
        PendingReceiveDTO dto = new PendingReceiveDTO(1L, "PO-1", "ABC-VN-0001", "Test Product", 100, "SEA", "PAID");
        when(warehouseReceiptService.getPendingReceives()).thenReturn(List.of(dto));

        mockMvc.perform(get("/v1/warehouse-receipts/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].poId").value(1));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void receiveGoods_shouldReturn201() throws Exception {
        WarehouseReceiptDTO dto = new WarehouseReceiptDTO(1L, 1L, 100, null, "Inspector", "Good", null, "RECEIVED", null, null);
        when(warehouseReceiptService.receiveGoods(any())).thenReturn(dto);

        mockMvc.perform(post("/v1/warehouse-receipts/receive")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"poId\":1,\"receivedQty\":100}"))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser
    void getAllWarehouseReceipts_shouldReturnList() throws Exception {
        WarehouseReceiptDTO dto = new WarehouseReceiptDTO(1L, 1L, 100, null, "Inspector", "Good", null, "RECEIVED", null, null);
        when(warehouseReceiptService.getAllWarehouseReceipts()).thenReturn(List.of(dto));

        mockMvc.perform(get("/v1/warehouse-receipts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].poId").value(1));
    }

    @Test
    @WithMockUser
    void getWarehouseReceiptById_shouldReturnReceipt() throws Exception {
        WarehouseReceiptDTO dto = new WarehouseReceiptDTO(1L, 1L, 100, null, "Inspector", "Good", null, "RECEIVED", null, null);
        when(warehouseReceiptService.getWarehouseReceiptById(1L)).thenReturn(dto);

        mockMvc.perform(get("/v1/warehouse-receipts/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createWarehouseReceipt_shouldReturn201() throws Exception {
        WarehouseReceiptDTO dto = new WarehouseReceiptDTO(1L, 1L, 100, null, "Inspector", "Good", null, "RECEIVED", null, null);
        when(warehouseReceiptService.createWarehouseReceipt(any(WarehouseReceiptDTO.class))).thenReturn(dto);

        mockMvc.perform(post("/v1/warehouse-receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"poId\":1,\"receivedQty\":100}"))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updateWarehouseReceipt_shouldReturnUpdated() throws Exception {
        WarehouseReceiptDTO dto = new WarehouseReceiptDTO(1L, 1L, 80, null, "Inspector B", "Fair", null, "RECEIVED", null, null);
        when(warehouseReceiptService.updateWarehouseReceipt(eq(1L), any(WarehouseReceiptDTO.class))).thenReturn(dto);

        mockMvc.perform(put("/v1/warehouse-receipts/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"poId\":1,\"receivedQty\":80}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteWarehouseReceipt_shouldReturn204() throws Exception {
        doNothing().when(warehouseReceiptService).deleteWarehouseReceipt(1L);

        mockMvc.perform(delete("/v1/warehouse-receipts/1"))
                .andExpect(status().isNoContent());
    }
}
