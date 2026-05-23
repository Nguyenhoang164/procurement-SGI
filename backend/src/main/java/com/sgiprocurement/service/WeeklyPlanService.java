package com.sgiprocurement.service;

import com.sgiprocurement.model.WeeklyPlan;
import com.sgiprocurement.dto.WeeklyPlanDTO;
import com.sgiprocurement.repository.ProductRepository;
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
        // Kiểm tra xem sản phẩm đã tồn tại trong danh mục chưa
        if (dto.getPosCode() != null && !dto.getPosCode().isEmpty()) {
            boolean productExists = productRepository.findByPosCode(dto.getPosCode()).isPresent();
            if (!productExists) {
                // Nếu chưa có (mã mới từ nút Đề xuất), ta có thể tạo bản ghi nháp ở đây 
                // hoặc đơn giản là cho phép lưu. Ở đây tôi giữ cho phép lưu để linh hoạt.
            }
        }
        
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

    public WeeklyPlanDTO approveL1(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        
        if (!"PENDING_L1".equals(plan.getStatus()) && !"DRAFT".equals(plan.getStatus()) && !"PENDING".equals(plan.getStatus())) {
            // Chấp nhận DRAFT hoặc PENDING (nếu có) chuyển sang PENDING_L1 hoặc PENDING_L2
            // Tuy nhiên theo flow chuẩn: DRAFT -> PENDING_L1 -> PENDING_L2 -> APPROVED
        }
        
        plan.setStatus("PENDING_L2");
        WeeklyPlan updated = weeklyPlanRepository.save(plan);
        return convertToDTO(updated);
    }

    public WeeklyPlanDTO approveL2(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        
        if (!"PENDING_L2".equals(plan.getStatus())) {
            throw new IllegalStateException("Kế hoạch không ở trạng thái chờ duyệt L2");
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

    public WeeklyPlanDTO submitForApproval(Long id) {
        WeeklyPlan plan = weeklyPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Weekly plan not found with id: " + id));
        
        plan.setStatus("PENDING_L1");
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
        return plan;
    }

}
