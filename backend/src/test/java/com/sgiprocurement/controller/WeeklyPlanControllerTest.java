package com.sgiprocurement.controller;

import com.sgiprocurement.dto.WeeklyPlanDTO;
import com.sgiprocurement.service.WeeklyPlanService;
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
class WeeklyPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WeeklyPlanService weeklyPlanService;

    private WeeklyPlanDTO createDTO() {
        WeeklyPlanDTO dto = new WeeklyPlanDTO();
        dto.setId(1L);
        dto.setPosCode("ABC-VN-0001");
        dto.setSuggestedQty(50);
        dto.setStatus("DRAFT");
        return dto;
    }

    @Test
    @WithMockUser
    void getAllWeeklyPlans_shouldReturnList() throws Exception {
        when(weeklyPlanService.getAllWeeklyPlans()).thenReturn(List.of(createDTO()));

        mockMvc.perform(get("/v1/weekly-plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].posCode").value("ABC-VN-0001"));
    }

    @Test
    @WithMockUser
    void getWeeklyPlanById_shouldReturnPlan() throws Exception {
        when(weeklyPlanService.getWeeklyPlanById(1L)).thenReturn(createDTO());

        mockMvc.perform(get("/v1/weekly-plans/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void createWeeklyPlan_shouldReturn201() throws Exception {
        when(weeklyPlanService.createWeeklyPlan(any(WeeklyPlanDTO.class))).thenReturn(createDTO());

        mockMvc.perform(post("/v1/weekly-plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"posCode\":\"ABC-VN-0001\",\"suggestedQty\":50}"))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void updateWeeklyPlan_shouldReturnUpdated() throws Exception {
        when(weeklyPlanService.updateWeeklyPlan(eq(1L), any(WeeklyPlanDTO.class))).thenReturn(createDTO());

        mockMvc.perform(put("/v1/weekly-plans/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"posCode\":\"ABC-VN-0001\",\"suggestedQty\":50}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteWeeklyPlan_shouldReturn204() throws Exception {
        doNothing().when(weeklyPlanService).deleteWeeklyPlan(1L);

        mockMvc.perform(delete("/v1/weekly-plans/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void submitForApproval_shouldSubmit() throws Exception {
        when(weeklyPlanService.submitForApproval(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/weekly-plans/1/submit"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void approveL1_shouldApprove() throws Exception {
        when(weeklyPlanService.approveL1(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/weekly-plans/1/approve-l1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void approveL2_shouldApprove() throws Exception {
        when(weeklyPlanService.approveL2(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/weekly-plans/1/approve-l2"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void reject_shouldReject() throws Exception {
        when(weeklyPlanService.reject(1L)).thenReturn(createDTO());

        mockMvc.perform(post("/v1/weekly-plans/1/reject"))
                .andExpect(status().isOk());
    }
}
