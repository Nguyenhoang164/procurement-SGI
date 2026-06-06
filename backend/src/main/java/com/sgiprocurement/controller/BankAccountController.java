package com.sgiprocurement.controller;

import com.sgiprocurement.dto.BankAccountDTO;
import com.sgiprocurement.dto.BankNameConfigDTO;
import com.sgiprocurement.service.BankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/v1/bank-accounts")
@CrossOrigin(origins = "http://localhost:3000")
public class BankAccountController {

    @Autowired
    private BankAccountService bankAccountService;

    @GetMapping("/bank-names")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<List<BankNameConfigDTO>> getAllBankNames() {
        return ResponseEntity.ok(bankAccountService.getAllBankNames());
    }

    @PostMapping("/bank-names")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<BankNameConfigDTO> addBankName(@Valid @RequestBody BankNameConfigDTO dto) {
        BankNameConfigDTO created = bankAccountService.addBankName(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<List<BankAccountDTO>> getAll() {
        return ResponseEntity.ok(bankAccountService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CEO', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT', 'SALES', 'SALES_MANAGER')")
    public ResponseEntity<BankAccountDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bankAccountService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<BankAccountDTO> create(@Valid @RequestBody BankAccountDTO dto) {
        BankAccountDTO created = bankAccountService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<BankAccountDTO> update(@PathVariable Long id, @Valid @RequestBody BankAccountDTO dto) {
        BankAccountDTO updated = bankAccountService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bankAccountService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/qr-code")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'CHIEF_ACCOUNTANT')")
    public ResponseEntity<BankAccountDTO> uploadQrCode(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        BankAccountDTO updated = bankAccountService.uploadQrCode(id, file);
        return ResponseEntity.ok(updated);
    }
}
