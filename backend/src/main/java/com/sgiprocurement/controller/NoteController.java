package com.sgiprocurement.controller;

import com.sgiprocurement.dto.NoteDTO;
import com.sgiprocurement.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/v1/notes")
@CrossOrigin(origins = "http://localhost:3000")
public class NoteController {

    @Autowired
    private NoteService noteService;

    @GetMapping("/{entityType}/{entityId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'WAREHOUSE', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER', 'PURCHASING')")
    public ResponseEntity<List<NoteDTO>> getNotes(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return ResponseEntity.ok(noteService.getNotes(entityType, entityId));
    }

    @PostMapping
    public ResponseEntity<NoteDTO> createNote(@Valid @RequestBody NoteDTO dto) {
        String role = getCurrentRole();
        if (role.equals("PENDING")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.createNote(dto));
    }

    private String getCurrentRole() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");
    }

    private boolean hasAnyRole(String currentRole, String... roles) {
        for (String role : roles) {
            if (currentRole.equals(role)) return true;
        }
        return false;
    }
}
