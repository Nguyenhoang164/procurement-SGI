package com.sgiprocurement.service;

import com.sgiprocurement.model.WeeklyPlan;
import com.sgiprocurement.model.WeeklyPlanItem;
import com.sgiprocurement.dto.WeeklyPlanDTO;
import com.sgiprocurement.dto.WeeklyPlanItemDTO;
import com.sgiprocurement.repository.WeeklyPlanRepository;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class WeeklyPlanService {

    @Autowired
    private WeeklyPlanRepository weeklyPlanRepository;

    @Autowired
    private ProductRepository productRepository;

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
        if (plan.getItems() != null) {
            for (WeeklyPlanItem item : plan.getItems()) {
                item.setPlan(plan);
            }
        }
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

        if (dto.getItems() != null) {
            plan.getItems().clear();
            for (WeeklyPlanItemDTO itemDTO : dto.getItems()) {
                WeeklyPlanItem item = convertItemToEntity(itemDTO);
                item.setPlan(plan);
                plan.getItems().add(item);
            }
        }

        WeeklyPlan updated = weeklyPlanRepository.save(plan);
        return convertToDTO(updated);
    }

    public WeeklyPlanDTO submitForApproval(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        plan.setStatus("PENDING_L1");
        WeeklyPlan updated = weeklyPlanRepository.save(plan);
        return convertToDTO(updated);
    }

    public WeeklyPlanDTO approveL1(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        plan.setStatus("PENDING_L2");
        WeeklyPlan updated = weeklyPlanRepository.save(plan);
        return convertToDTO(updated);
    }

    public WeeklyPlanDTO approveL2(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        if (!"PENDING_L2".equals(plan.getStatus())) {
            throw new IllegalStateException("Ke hoach khong o trang thai cho duyet L2");
        }
        plan.setStatus("APPROVED");
        WeeklyPlan updated = weeklyPlanRepository.save(plan);
        return convertToDTO(updated);
    }

    public WeeklyPlanDTO reject(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        plan.setStatus("REJECTED");
        WeeklyPlan updated = weeklyPlanRepository.save(plan);
        return convertToDTO(updated);
    }

    public void deleteWeeklyPlan(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        weeklyPlanRepository.delete(plan);
    }

    private WeeklyPlanDTO convertToDTO(WeeklyPlan plan) {
        WeeklyPlanDTO dto = new WeeklyPlanDTO();
        dto.setId(plan.getId());
        dto.setPosCode(plan.getPosCode());
        dto.setProposedDate(plan.getProposedDate());
        dto.setSuggestedQty(plan.getSuggestedQty());
        dto.setSpec(plan.getSpec());
        dto.setCountry(plan.getCountry());
        dto.setShippingMethod(plan.getShippingMethod());
        dto.setRecentUnitPrice(plan.getRecentUnitPrice());
        dto.setNote(plan.getNote());
        dto.setStatus(plan.getStatus());
        dto.setCreatedBy(plan.getCreatedBy());
        dto.setCreatedAt(plan.getCreatedAt());
        dto.setUpdatedAt(plan.getUpdatedAt());
        if (plan.getItems() != null) {
            dto.setItems(plan.getItems().stream().map(this::convertItemToDTO).collect(Collectors.toList()));
        } else {
            dto.setItems(Collections.emptyList());
        }
        return dto;
    }

    private WeeklyPlan convertToEntity(WeeklyPlanDTO dto) {
        WeeklyPlan plan = new WeeklyPlan();
        plan.setId(dto.getId());
        plan.setProposedDate(dto.getProposedDate());
        plan.setPosCode(dto.getPosCode());
        plan.setSuggestedQty(dto.getSuggestedQty());
        plan.setSpec(dto.getSpec());
        plan.setCountry(dto.getCountry());
        plan.setShippingMethod(dto.getShippingMethod());
        plan.setRecentUnitPrice(dto.getRecentUnitPrice());
        plan.setNote(dto.getNote());
        plan.setStatus(dto.getStatus());
        plan.setCreatedBy(dto.getCreatedBy());
        plan.setCreatedAt(dto.getCreatedAt());
        plan.setUpdatedAt(dto.getUpdatedAt());
        if (dto.getItems() != null) {
            plan.setItems(dto.getItems().stream().map(itemDTO -> {
                WeeklyPlanItem item = convertItemToEntity(itemDTO);
                item.setPlan(plan);
                return item;
            }).collect(Collectors.toList()));
        }
        return plan;
    }

    private WeeklyPlanItemDTO convertItemToDTO(WeeklyPlanItem item) {
        WeeklyPlanItemDTO dto = new WeeklyPlanItemDTO();
        dto.setId(item.getId());
        dto.setPosCode(item.getPosCode());
        dto.setProductName(item.getProductName());
        dto.setProductType(item.getProductType());
        dto.setSuggestedQty(item.getSuggestedQty());
        dto.setCountry(item.getCountry());
        dto.setShippingMethod(item.getShippingMethod());
        dto.setReferencePrice(item.getReferencePrice());
        dto.setCurrency(item.getCurrency());
        dto.setSpec(item.getSpec());
        dto.setSourceLink(item.getSourceLink());
        dto.setPriorityLevel(item.getPriorityLevel());
        return dto;
    }

    private WeeklyPlanItem convertItemToEntity(WeeklyPlanItemDTO dto) {
        WeeklyPlanItem item = new WeeklyPlanItem();
        item.setId(dto.getId());
        item.setPosCode(dto.getPosCode());
        item.setProductName(dto.getProductName());
        item.setProductType(dto.getProductType());
        item.setSuggestedQty(dto.getSuggestedQty());
        item.setCountry(dto.getCountry());
        item.setShippingMethod(dto.getShippingMethod());
        item.setReferencePrice(dto.getReferencePrice());
        item.setCurrency(dto.getCurrency());
        item.setSpec(dto.getSpec());
        item.setSourceLink(dto.getSourceLink());
        item.setPriorityLevel(dto.getPriorityLevel());
        return item;
    }

}
