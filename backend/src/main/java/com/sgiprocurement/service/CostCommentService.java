package com.sgiprocurement.service;

import com.sgiprocurement.model.CostComment;
import com.sgiprocurement.dto.CostCommentDTO;
import com.sgiprocurement.repository.CostCommentRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CostCommentService {

    @Autowired
    private CostCommentRepository costCommentRepository;

    public List<CostCommentDTO> getCommentsByPoId(Long poId) {
        return costCommentRepository.findByPoIdOrderByCreatedAtDesc(poId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CostCommentDTO createComment(CostCommentDTO dto) {
        CostComment comment = new CostComment();
        comment.setPoId(dto.getPoId());
        comment.setExpectedCostVnd(dto.getExpectedCostVnd());
        comment.setActualCostVnd(dto.getActualCostVnd());

        if (dto.getExpectedCostVnd() != null && dto.getActualCostVnd() != null) {
            BigDecimal variance = dto.getActualCostVnd().subtract(dto.getExpectedCostVnd());
            comment.setVarianceAmountVnd(variance);
        }

        comment.setContent(dto.getContent());
        comment.setType(dto.getType() != null ? dto.getType() : "COST_VARIANCE");
        comment.setCreatedBy(dto.getCreatedBy());

        CostComment saved = costCommentRepository.save(comment);
        return convertToDTO(saved);
    }

    private CostCommentDTO convertToDTO(CostComment comment) {
        return new CostCommentDTO(
                comment.getId(),
                comment.getPoId(),
                comment.getExpectedCostVnd(),
                comment.getActualCostVnd(),
                comment.getVarianceAmountVnd(),
                comment.getContent(),
                comment.getType(),
                comment.getCreatedBy(),
                comment.getCreatedAt()
        );
    }

}
