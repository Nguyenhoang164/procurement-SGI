package com.sgiprocurement.service;

import com.sgiprocurement.dto.BankAccountDTO;
import com.sgiprocurement.dto.BankNameConfigDTO;
import com.sgiprocurement.exception.ResourceNotFoundException;
import com.sgiprocurement.model.BankAccount;
import com.sgiprocurement.model.BankNameConfig;
import com.sgiprocurement.repository.BankAccountRepository;
import com.sgiprocurement.repository.BankNameConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BankAccountService {

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private BankNameConfigRepository bankNameConfigRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public List<BankAccountDTO> getAll() {
        return bankAccountRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public BankAccountDTO getById(Long id) {
        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + id));
        return convertToDTO(account);
    }

    public BankAccountDTO create(BankAccountDTO dto) {
        BankAccount entity = convertToEntity(dto);
        BankAccount saved = bankAccountRepository.save(entity);
        return convertToDTO(saved);
    }

    public BankAccountDTO update(Long id, BankAccountDTO dto) {
        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + id));

        account.setAccountNumber(dto.getAccountNumber());
        account.setAccountHolder(dto.getAccountHolder());
        account.setBankName(dto.getBankName());
        if (dto.getQrCode() != null) {
            account.setQrCode(dto.getQrCode());
        }
        BankAccount saved = bankAccountRepository.save(account);
        return convertToDTO(saved);
    }

    public BankAccountDTO uploadQrCode(Long id, MultipartFile file) throws IOException {
        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + id));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Chua chon file de tai len");
        }

        String qrPath = fileStorageService.storePaymentAttachment(id, file);
        account.setQrCode(qrPath);
        BankAccount saved = bankAccountRepository.save(account);
        return convertToDTO(saved);
    }

    public void delete(Long id) {
        BankAccount account = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found with id: " + id));
        bankAccountRepository.delete(account);
    }

    private BankAccountDTO convertToDTO(BankAccount entity) {
        BankAccountDTO dto = new BankAccountDTO();
        dto.setId(entity.getId());
        dto.setAccountNumber(entity.getAccountNumber());
        dto.setAccountHolder(entity.getAccountHolder());
        dto.setBankName(entity.getBankName());
        dto.setQrCode(entity.getQrCode());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    private BankAccount convertToEntity(BankAccountDTO dto) {
        BankAccount entity = new BankAccount();
        entity.setId(dto.getId());
        entity.setAccountNumber(dto.getAccountNumber());
        entity.setAccountHolder(dto.getAccountHolder());
        entity.setBankName(dto.getBankName());
        entity.setQrCode(dto.getQrCode());
        entity.setCreatedBy(dto.getCreatedBy());
        return entity;
    }

    public List<BankNameConfigDTO> getAllBankNames() {
        return bankNameConfigRepository.findAll()
                .stream()
                .map(this::toBankNameDTO)
                .collect(Collectors.toList());
    }

    public BankNameConfigDTO addBankName(BankNameConfigDTO dto) {
        if (dto.getBankName() == null || dto.getBankName().isBlank()) {
            throw new IllegalArgumentException("Ten ngan hang khong duoc de trong");
        }
        if (bankNameConfigRepository.existsByBankName(dto.getBankName().trim())) {
            throw new IllegalArgumentException("Ten ngan hang da ton tai");
        }
        BankNameConfig entity = new BankNameConfig();
        entity.setBankName(dto.getBankName().trim());
        entity.setCreatedBy(dto.getBankName());
        BankNameConfig saved = bankNameConfigRepository.save(entity);
        return toBankNameDTO(saved);
    }

    private BankNameConfigDTO toBankNameDTO(BankNameConfig entity) {
        BankNameConfigDTO dto = new BankNameConfigDTO();
        dto.setId(entity.getId());
        dto.setBankName(entity.getBankName());
        return dto;
    }
}
