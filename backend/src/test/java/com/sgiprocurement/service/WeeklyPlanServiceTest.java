package com.sgiprocurement.service;

import com.sgiprocurement.dto.WeeklyPlanDTO;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.model.Product;
import com.sgiprocurement.model.WeeklyPlan;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.repository.WeeklyPlanRepository;
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
class WeeklyPlanServiceTest {

    @Mock
    private WeeklyPlanRepository weeklyPlanRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private WeeklyPlanService weeklyPlanService;

    private WeeklyPlan plan;
    private WeeklyPlanDTO planDTO;

    @BeforeEach
    void setUp() {
        plan = new WeeklyPlan();
        plan.setId(1L);
        plan.setPosCode("ABC-VN-0001");
        plan.setSuggestedQty(50);
        plan.setStatus("DRAFT");

        planDTO = new WeeklyPlanDTO();
        planDTO.setPosCode("ABC-VN-0001");
        planDTO.setSuggestedQty(50);
    }

    @Test
    void getAllWeeklyPlans_shouldReturnAll() {
        when(weeklyPlanRepository.findAll()).thenReturn(List.of(plan));

        List<WeeklyPlanDTO> result = weeklyPlanService.getAllWeeklyPlans();

        assertEquals(1, result.size());
    }

    @Test
    void getWeeklyPlanById_shouldReturn_whenExists() {
        when(weeklyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));

        WeeklyPlanDTO result = weeklyPlanService.getWeeklyPlanById(1L);

        assertNotNull(result);
        assertEquals("ABC-VN-0001", result.getPosCode());
    }

    @Test
    void getWeeklyPlanById_shouldThrow_whenNotFound() {
        when(weeklyPlanRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> weeklyPlanService.getWeeklyPlanById(99L));
    }

    @Test
    void getWeeklyPlansByStatus_shouldFilterByStatus() {
        when(weeklyPlanRepository.findByStatus("DRAFT")).thenReturn(List.of(plan));

        List<WeeklyPlanDTO> result = weeklyPlanService.getWeeklyPlansByStatus("DRAFT");

        assertEquals(1, result.size());
    }

    @Test
    void createWeeklyPlan_shouldSetDefaults() {
        when(weeklyPlanRepository.save(any(WeeklyPlan.class))).thenAnswer(invocation -> {
            WeeklyPlan saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        WeeklyPlanDTO result = weeklyPlanService.createWeeklyPlan(planDTO);

        assertNotNull(result);
        assertEquals("DRAFT", result.getStatus());
        assertNotNull(result.getProposedDate());
    }

    @Test
    void updateWeeklyPlan_shouldUpdateFields() {
        when(weeklyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(weeklyPlanRepository.save(any(WeeklyPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        planDTO.setSuggestedQty(100);
        planDTO.setCountry("VN");
        WeeklyPlanDTO result = weeklyPlanService.updateWeeklyPlan(1L, planDTO);

        assertEquals(100, result.getSuggestedQty());
        assertEquals("VN", result.getCountry());
    }

    @Test
    void submitForApproval_shouldSetPendingL1() {
        when(weeklyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(weeklyPlanRepository.save(any(WeeklyPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WeeklyPlanDTO result = weeklyPlanService.submitForApproval(1L);

        assertEquals("PENDING_L1", result.getStatus());
    }

    @Test
    void approveL1_shouldSetPendingL2() {
        plan.setStatus("PENDING_L1");
        when(weeklyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(weeklyPlanRepository.save(any(WeeklyPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WeeklyPlanDTO result = weeklyPlanService.approveL1(1L);

        assertEquals("PENDING_L2", result.getStatus());
    }

    @Test
    void approveL2_shouldApprove_whenPendingL2() {
        plan.setStatus("PENDING_L2");
        when(weeklyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(weeklyPlanRepository.save(any(WeeklyPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WeeklyPlanDTO result = weeklyPlanService.approveL2(1L);

        assertEquals("APPROVED", result.getStatus());
    }

    @Test
    void approveL2_shouldThrow_whenNotPendingL2() {
        plan.setStatus("DRAFT");
        when(weeklyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));

        assertThrows(IllegalStateException.class, () -> weeklyPlanService.approveL2(1L));
    }

    @Test
    void reject_shouldSetRejected() {
        when(weeklyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(weeklyPlanRepository.save(any(WeeklyPlan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WeeklyPlanDTO result = weeklyPlanService.reject(1L);

        assertEquals("REJECTED", result.getStatus());
    }

    @Test
    void deleteWeeklyPlan_shouldDelete_whenExists() {
        when(weeklyPlanRepository.findById(1L)).thenReturn(Optional.of(plan));

        weeklyPlanService.deleteWeeklyPlan(1L);

        verify(weeklyPlanRepository).delete(plan);
    }

    @Test
    void deleteWeeklyPlan_shouldThrow_whenNotFound() {
        when(weeklyPlanRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> weeklyPlanService.deleteWeeklyPlan(99L));
    }
}
