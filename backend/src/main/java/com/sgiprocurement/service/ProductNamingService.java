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
     * Generate POS code: SGI-[MARKET]-[CATEGORY]-[YYYYMM]-[SEQUENCE]
     */
    public String generatePosCode(String market, String categoryCode) {
        if (market == null) market = "XX";
        if (categoryCode == null) categoryCode = "NA";

        String ym = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        String prefix = String.format("SGI-%s-%s-%s-", market.toUpperCase(), categoryCode.toUpperCase(), ym);

        long count = productRepository.countByPosCodeStartingWith(prefix);
        long seq = count + 1;
        String seqStr = String.format("%04d", seq);
        return prefix + seqStr;
    }

}
