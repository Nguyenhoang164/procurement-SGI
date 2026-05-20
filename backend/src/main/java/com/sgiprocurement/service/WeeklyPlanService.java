package com.sgiprocurement.service;

import com.sgiprocurement.model.WeeklyPlan;
import com.sgiprocurement.dto.WeeklyPlanDTO;
import com.sgiprocurement.repository.WeeklyPlanRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WeeklyPlanService {

    @Autowired
    private WeeklyPlanRepository weeklyPlanRepository;

    public List<WeeklyPlanDTO> getAllWeeklyPlans() {
        return weeklyPlanRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public WeeklyPlanDTO getWeeklyPlanById(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        return convertToDTO(plan);
    }

    public List<WeeklyPlanDTO> getWeeklyPlansByStatus(String status) {
        return weeklyPlanRepository.findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public WeeklyPlanDTO createWeeklyPlan(WeeklyPlanDTO dto) {
        WeeklyPlan plan = convertToEntity(dto);
        plan.setProposedDate(LocalDateTime.now());
        plan.setStatus("DRAFT");
        WeeklyPlan saved = weeklyPlanRepository.save(plan);
        return convertToDTO(saved);
    }

    public WeeklyPlanDTO updateWeeklyPlan(Long id, WeeklyPlanDTO dto) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));

        plan.setPosCode(dto.getPosCode());
        plan.setSuggestedQty(dto.getSuggestedQty());
        plan.setSpec(dto.getSpec());
        plan.setCountry(dto.getCountry());
        plan.setShippingMethod(dto.getShippingMethod());
        plan.setRecentUnitPrice(dto.getRecentUnitPrice());
        plan.setNote(dto.getNote());

        WeeklyPlan updated = weeklyPlanRepository.save(plan);
        return convertToDTO(updated);
    }

    public void deleteWeeklyPlan(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        weeklyPlanRepository.delete(plan);
    }

    private WeeklyPlanDTO convertToDTO(WeeklyPlan plan) {
        return new WeeklyPlanDTO(
                plan.getId(),
                plan.getPosCode(),
                plan.getProposedDate(),
                plan.getSuggestedQty(),
                plan.getSpec(),
                plan.getCountry(),
                plan.getShippingMethod(),
                plan.getRecentUnitPrice(),
                plan.getNote(),
                plan.getStatus(),
                plan.getCreatedBy(),
                plan.getCreatedAt(),
                plan.getUpdatedAt()
        );
    }

    private WeeklyPlan convertToEntity(WeeklyPlanDTO dto) {
        return new WeeklyPlan(
                dto.getId(),
                dto.getProposedDate(),
                dto.getPosCode(),
                dto.getSuggestedQty(),
                dto.getSpec(),
                dto.getCountry(),
                dto.getShippingMethod(),
                dto.getRecentUnitPrice(),
                dto.getNote(),
                dto.getStatus(),
                dto.getCreatedBy(),
                dto.getCreatedAt(),
                dto.getUpdatedAt()
        );
    }

}
