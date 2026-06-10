package com.sgiprocurement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.sgiprocurement.repository.ProductRepository;

@Service
public class ProductNamingService {

    @Autowired
    private ProductRepository productRepository;

    public String generatePosCode(String productName, String market, String department, int iteration) {
        String deptPrefix = getDepartmentPrefix(department);
        String namePrefix = getNamePrefix(productName);

        String finalPrefix = String.format("%s-%s-", deptPrefix, namePrefix);

        long count = productRepository.countByPosCodeStartingWith(finalPrefix);
        long seq = count + 1 + iteration;
        return finalPrefix + String.format("%03d", seq);
    }

    public String generatePosCode(String productName, String market, String department) {
        return generatePosCode(productName, market, department, 0);
    }

    private String getDepartmentPrefix(String department) {
        if (department == null || department.trim().isEmpty()) {
            return "XXX";
        }
        String trimmed = department.trim();
        return trimmed.substring(0, Math.min(3, trimmed.length())).toUpperCase();
    }

    private String getNamePrefix(String productName) {
        if (productName == null || productName.trim().isEmpty()) {
            return "XXXX";
        }
        String[] parts = productName.trim().split("[^\\p{L}\\p{N}]+");
        StringBuilder prefix = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) continue;
            prefix.append(Character.toUpperCase(part.charAt(0)));
            if (prefix.length() >= 4) break;
        }
        while (prefix.length() < 4) prefix.append('X');
        return prefix.toString();
    }

}
