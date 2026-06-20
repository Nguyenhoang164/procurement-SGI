package com.sgiprocurement.service;

import com.sgiprocurement.model.Product;
import com.sgiprocurement.model.ProductCombo;
import com.sgiprocurement.model.ProductImage;
import com.sgiprocurement.dto.ProductComboDTO;
import com.sgiprocurement.dto.ProductDTO;
import com.sgiprocurement.dto.ProductImageDTO;
import com.sgiprocurement.dto.ProductImportResult;
import com.sgiprocurement.repository.ProductComboRepository;
import com.sgiprocurement.repository.ProductRepository;
import com.sgiprocurement.repository.ProductImageRepository;
import com.sgiprocurement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;

@Service
@Transactional
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private ProductComboRepository productComboRepository;

    @Autowired
    private ProductNamingService productNamingService;

    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProductDTO> searchProducts(String query) {
        return productRepository.findByProductNameContainingIgnoreCase(query)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ProductDTO> searchProductsByDepartment(String query, String department) {
        if (department == null || department.isBlank()) {
            return searchProducts(query);
        }
        return productRepository.findByProductNameContainingIgnoreCaseAndDepartment(query, department)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return convertToDTO(product);
    }

    public ProductDTO createProduct(ProductDTO productDTO) {
        String name = productDTO.getProductName();
        if (name != null && productRepository.findByProductName(name.trim()).isPresent()) {
            throw new RuntimeException("Sản phẩm \"" + name.trim() + "\" đã tồn tại trong hệ thống");
        }
        Product product = convertToEntity(productDTO);
        if (product.getPosCode() == null || product.getPosCode().isEmpty()) {
            String code = productNamingService.generatePosCode(
                    product.getProductName(),
                    product.getMarketCode(),
                    product.getDepartment()
            );
            product.setPosCode(code);
        }
        product.setStatus("ACTIVE");
        Product savedProduct = productRepository.save(product);

        if (productDTO.getImages() != null) {
            for (ProductImageDTO imgDTO : productDTO.getImages()) {
                ProductImage img = new ProductImage();
                img.setProductId(savedProduct.getId());
                img.setImageUrl(imgDTO.getImageUrl());
                img.setSortOrder(imgDTO.getSortOrder());
                productImageRepository.save(img);
            }
        }

        return convertToDTO(savedProduct);
    }

    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        product.setProductName(productDTO.getProductName());
        product.setVietnameseName(productDTO.getVietnameseName());
        product.setOldPosCode(productDTO.getOldPosCode());
        product.setSpec(productDTO.getSpec());
        product.setCategoryId(productDTO.getCategoryId());
        product.setMarketCode(productDTO.getMarketCode());
        product.setUnit(productDTO.getUnit());
        product.setStatus(productDTO.getStatus());
        product.setSourceLink(productDTO.getSourceLink());
        product.setProductType(productDTO.getProductType());
        product.setDepartment(productDTO.getDepartment());
        product.setPosCode(productDTO.getPosCode());

        Product updatedProduct = productRepository.save(product);

        if (productDTO.getImages() != null) {
            productImageRepository.deleteByProductId(updatedProduct.getId());
            for (ProductImageDTO imgDTO : productDTO.getImages()) {
                ProductImage img = new ProductImage();
                img.setProductId(updatedProduct.getId());
                img.setImageUrl(imgDTO.getImageUrl());
                img.setSortOrder(imgDTO.getSortOrder());
                productImageRepository.save(img);
            }
        }

        return convertToDTO(updatedProduct);
    }

    public String generatePosCode(String productName, String market, String department) {
        return productNamingService.generatePosCode(productName, market, department, 0);
    }

    public String generatePosCode(String productName, String market, String department, int iteration) {
        return productNamingService.generatePosCode(productName, market, department, iteration);
    }

    public ProductImportResult importProducts(List<ProductDTO> products) {
        ProductImportResult result = new ProductImportResult();
        result.setTotalRows(products.size());

        for (int i = 0; i < products.size(); i++) {
            ProductDTO dto = products.get(i);
            int rowNum = i + 2;
            try {
                String name = dto.getProductName();
                if (name == null || name.trim().isEmpty()) {
                    result.addError("DĂ²ng " + rowNum + ": TĂªn sáº£n pháº©m khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
                    continue;
                }
            if (productRepository.findByProductName(name.trim()).isPresent()) {
                String dupName = name.trim();
                result.addError("Dòng " + rowNum + ": \"" + dupName + "\" đã tồn tại");
                result.addDuplicateName(dupName);
                continue;
            }
                Product product = new Product();
                product.setProductName(name.trim());
                product.setVietnameseName(dto.getVietnameseName());
                product.setOldPosCode(dto.getOldPosCode());
                product.setMarketCode(dto.getMarketCode() != null ? dto.getMarketCode().toUpperCase() : "VN");
                product.setSpec(dto.getSpec());
                product.setUnit(dto.getUnit());
                product.setSourceLink(dto.getSourceLink());
                product.setProductType(dto.getProductType());
                product.setDepartment(dto.getDepartment());
                product.setStatus("ACTIVE");

                String code = productNamingService.generatePosCode(
                        product.getProductName(), product.getMarketCode(), product.getDepartment()
                );
                product.setPosCode(code);

                productRepository.save(product);
                result.setSuccessCount(result.getSuccessCount() + 1);
            } catch (Exception e) {
                result.addError("DĂ²ng " + rowNum + ": " + e.getMessage());
            }
        }

        result.setErrorCount(result.getErrors().size());
        return result;
    }

    public ProductDTO getProductByPosCode(String posCode) {
        Product product = productRepository.findByPosCode(posCode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with posCode: " + posCode));
        return convertToDTO(product);
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        productComboRepository.deleteByProductId(id);
        productImageRepository.deleteByProductId(id);
        productRepository.delete(product);
    }

    public void batchDelete(List<Long> ids) {
        for (Long id : ids) {
            productComboRepository.deleteByProductId(id);
            productImageRepository.deleteByProductId(id);
        }
        List<Product> products = productRepository.findAllById(ids);
        productRepository.deleteAll(products);
    }

    public void deleteAllProducts() {
        productRepository.deleteAll();
    }

    public int regenerateAllCodes() {
        List<Product> products = productRepository.findAll();
        int count = 0;
        for (Product product : products) {
            String newCode = productNamingService.generatePosCode(
                    product.getProductName(), product.getMarketCode(), product.getDepartment()
            );
            if (!newCode.equals(product.getPosCode())) {
                product.setPosCode(newCode);
                productRepository.saveAndFlush(product);
                count++;
            }
        }
        return count;
    }

    public List<ProductComboDTO> getCombos(Long productId) {
        getProductOrThrow(productId);
        return productComboRepository.findByProductIdOrderByIdAsc(productId).stream()
                .map(this::convertComboToDTO)
                .collect(Collectors.toList());
    }

    public ProductComboDTO createCombo(Long productId, ProductComboDTO dto) {
        Product product = getProductOrThrow(productId);
        ProductCombo combo = convertComboToEntity(dto);
        combo.setId(null);
        combo.setProductId(productId);
        combo.setComboCode(generateComboCode(product));
        if (combo.getStatus() == null || combo.getStatus().isEmpty()) {
            combo.setStatus("ACTIVE");
        }
        if (combo.getBaseQty() == null || combo.getBaseQty().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            combo.setBaseQty(java.math.BigDecimal.ONE);
        }
        return convertComboToDTO(productComboRepository.save(combo));
    }

    public ProductComboDTO updateCombo(Long productId, Long comboId, ProductComboDTO dto) {
        Product product = getProductOrThrow(productId);
        ProductCombo combo = productComboRepository.findById(comboId)
                .orElseThrow(() -> new ResourceNotFoundException("Product combo not found with id: " + comboId));
        if (!productId.equals(combo.getProductId())) {
            throw new ResourceNotFoundException("Product combo not found with id: " + comboId);
        }
        if (combo.getComboCode() == null || combo.getComboCode().isEmpty()) {
            combo.setComboCode(generateComboCode(product));
        }
        combo.setComboName(dto.getComboName());
        combo.setBaseQty(dto.getBaseQty() != null ? dto.getBaseQty() : java.math.BigDecimal.ONE);
        combo.setSaleUnit(dto.getSaleUnit());
        combo.setSalePriceVnd(dto.getSalePriceVnd());
        combo.setNote(dto.getNote());
        combo.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        return convertComboToDTO(productComboRepository.save(combo));
    }

    public void deleteCombo(Long productId, Long comboId) {
        getProductOrThrow(productId);
        ProductCombo combo = productComboRepository.findById(comboId)
                .orElseThrow(() -> new ResourceNotFoundException("Product combo not found with id: " + comboId));
        if (!productId.equals(combo.getProductId())) {
            throw new ResourceNotFoundException("Product combo not found with id: " + comboId);
        }
        productComboRepository.delete(combo);
    }

    private Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
    }

    private String generateComboCode(Product product) {
        String prefix = "CB-" + normalizeCodePart(product.getPosCode() != null ? product.getPosCode() : "SP-" + product.getId()) + "-";
        int nextSequence = productComboRepository.findByProductIdOrderByIdAsc(product.getId()).stream()
                .map(ProductCombo::getComboCode)
                .filter(code -> code != null && code.startsWith(prefix))
                .map(code -> code.substring(prefix.length()))
                .mapToInt(this::parseSequence)
                .max()
                .orElse(0) + 1;

        String comboCode;
        do {
            comboCode = prefix + String.format("%02d", nextSequence++);
        } while (productComboRepository.existsByComboCode(comboCode));

        return comboCode;
    }

    private String normalizeCodePart(String value) {
        String normalized = value.toUpperCase()
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isEmpty() ? "SP" : normalized;
    }

    private int parseSequence(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private ProductDTO convertToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setPosCode(product.getPosCode());
        dto.setOldPosCode(product.getOldPosCode());
        dto.setProductName(product.getProductName());
        dto.setVietnameseName(product.getVietnameseName());
        dto.setCategoryId(product.getCategoryId());
        dto.setMarketCode(product.getMarketCode());
        dto.setSpec(product.getSpec());
        dto.setUnit(product.getUnit());
        dto.setStatus(product.getStatus());
        dto.setSourceLink(product.getSourceLink());
        dto.setProductType(product.getProductType());
        dto.setDepartment(product.getDepartment());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId());
        dto.setImages(images.stream()
                .map(img -> new ProductImageDTO(img.getId(), img.getImageUrl(), img.getSortOrder()))
                .collect(Collectors.toList()));
        return dto;
    }

    private Product convertToEntity(ProductDTO productDTO) {
        Product p = new Product();
        p.setId(productDTO.getId());
        p.setPosCode(productDTO.getPosCode());
        p.setOldPosCode(productDTO.getOldPosCode());
        p.setProductName(productDTO.getProductName());
        p.setVietnameseName(productDTO.getVietnameseName());
        p.setSpec(productDTO.getSpec());
        p.setCategoryId(productDTO.getCategoryId());
        p.setMarketCode(productDTO.getMarketCode());
        p.setUnit(productDTO.getUnit());
        p.setStatus(productDTO.getStatus() != null ? productDTO.getStatus() : "ACTIVE");
        p.setSourceLink(productDTO.getSourceLink());
        p.setProductType(productDTO.getProductType());
        p.setDepartment(productDTO.getDepartment());
        p.setCreatedAt(productDTO.getCreatedAt());
        p.setUpdatedAt(productDTO.getUpdatedAt());
        return p;
    }

    private ProductComboDTO convertComboToDTO(ProductCombo combo) {
        ProductComboDTO dto = new ProductComboDTO();
        dto.setId(combo.getId());
        dto.setProductId(combo.getProductId());
        dto.setComboCode(combo.getComboCode());
        dto.setComboName(combo.getComboName());
        dto.setBaseQty(combo.getBaseQty());
        dto.setSaleUnit(combo.getSaleUnit());
        dto.setSalePriceVnd(combo.getSalePriceVnd());
        dto.setNote(combo.getNote());
        dto.setStatus(combo.getStatus());
        dto.setCreatedAt(combo.getCreatedAt());
        dto.setUpdatedAt(combo.getUpdatedAt());
        return dto;
    }

    private ProductCombo convertComboToEntity(ProductComboDTO dto) {
        ProductCombo combo = new ProductCombo();
        combo.setId(dto.getId());
        combo.setProductId(dto.getProductId());
        combo.setComboCode(dto.getComboCode());
        combo.setComboName(dto.getComboName());
        combo.setBaseQty(dto.getBaseQty());
        combo.setSaleUnit(dto.getSaleUnit());
        combo.setSalePriceVnd(dto.getSalePriceVnd());
        combo.setNote(dto.getNote());
        combo.setStatus(dto.getStatus());
        combo.setCreatedAt(dto.getCreatedAt());
        combo.setUpdatedAt(dto.getUpdatedAt());
        return combo;
    }

}



