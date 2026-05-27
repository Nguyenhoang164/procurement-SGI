package com.sgiprocurement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.sgiprocurement.repository.ProductRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ProductNamingService {

    @Autowired
    private ProductRepository productRepository;

    /**
     * Generate POS code from product name and market
     * @param iteration số thứ tự đề xuất (0 = mặc định, >0 = lần đề xuất tiếp theo)
     */
    public String generatePosCode(String productName, String market, int iteration) {
        String prefix = generateAbbreviation(productName);
        if (market == null || market.isEmpty()) market = "XX";

        String finalPrefix = String.format("%s-%s-", prefix.toUpperCase(), market.toUpperCase());

        long count = productRepository.countByPosCodeStartingWith(finalPrefix);
        long seq = count + 1 + iteration;
        String seqStr = String.format("%04d", seq);
        return finalPrefix + seqStr;
    }

    /**
     * Generate POS code from product name and market (default iteration = 0)
     */
    public String generatePosCode(String productName, String market) {
        return generatePosCode(productName, market, 0);
    }

    private String generateAbbreviation(String name) {
        if (name == null || name.trim().isEmpty()) return "PROD";
        
        // Tách theo khoảng trắng, dấu gạch ngang, gạch dưới, dấu gạch chéo
        // Ví dụ: C-JESUS CAR HANGING DECOR -> C JESUS CAR HANGING DECOR -> C J C H D -> CJCHD
        String normalized = name.trim().replaceAll("[\\s\\-/_&]+", " ").trim();
        String[] words = normalized.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                sb.append(word.charAt(0));
            }
        }
        return sb.toString().toUpperCase();
    }

}
