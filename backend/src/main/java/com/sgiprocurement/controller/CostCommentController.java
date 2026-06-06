package com.sgiprocurement.controller;

import com.sgiprocurement.dto.CostCommentDTO;
import com.sgiprocurement.service.CostCommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/v1/cost-comments")
@CrossOrigin(origins = "http://localhost:3000")
public class CostCommentController {

    @Autowired
    private CostCommentService costCommentService;

    @GetMapping("/po/{poId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<List<CostCommentDTO>> getByPoId(@PathVariable Long poId) {
        return ResponseEntity.ok(costCommentService.getCommentsByPoId(poId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES_MANAGER')")
    public ResponseEntity<CostCommentDTO> createComment(@Valid @RequestBody CostCommentDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(costCommentService.createComment(dto));
    }

}
