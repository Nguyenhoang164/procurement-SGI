package com.sgiprocurement.service;

import com.sgiprocurement.dto.AuditLogDTO;
import com.sgiprocurement.model.AuditLog;
import com.sgiprocurement.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void record(String username, String userRole, String action,
                       String entityType, String entityId, String details, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setUsername(username);
        log.setUserRole(userRole);
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetails(details);
        log.setIpAddress(ipAddress);
        log.setCreatedAt(LocalDateTime.now());
        auditLogRepository.save(log);
    }

    public Map<String, Object> getAuditLogsPaged(String username, String action,
                                                  int page, int size) {
        PageRequest pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> logPage;

        if (username != null && !username.isBlank()
                && action != null && !action.isBlank()) {
            logPage = auditLogRepository
                    .findByUsernameContainingIgnoreCaseAndAction(username, action, pageable);
        } else if (username != null && !username.isBlank()) {
            logPage = auditLogRepository
                    .findByUsernameContainingIgnoreCase(username, pageable);
        } else if (action != null && !action.isBlank()) {
            logPage = auditLogRepository.findByAction(action, pageable);
        } else {
            logPage = auditLogRepository.findAll(pageable);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("logs", logPage.getContent().stream().map(this::convertToDTO).toList());
        result.put("total", logPage.getTotalElements());
        result.put("page", page);
        result.put("size", size);
        return result;
    }

    private AuditLogDTO convertToDTO(AuditLog log) {
        return new AuditLogDTO(
                log.getId(), log.getUsername(), log.getUserRole(),
                log.getAction(), log.getEntityType(), log.getEntityId(),
                log.getDetails(), log.getIpAddress(), log.getCreatedAt()
        );
    }
}
